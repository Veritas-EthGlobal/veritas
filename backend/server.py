import os
import re
import numpy as np
import math
import subprocess
import logging

from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.responses import JSONResponse
import zipfile
import tempfile
import shutil
from pathlib import Path
from main import generate_chain, run_pipeline_for_files, calculate_advanced_score
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(debug=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
llm_chain, embedding_model = generate_chain()

@app.post("/analyze-zip/")
async def analyze_zip(zip_file: UploadFile = File(...)):
    """
    Analyzes code files from an uploaded ZIP archive.
    """
    logger.info("Request received for ZIP analysis")
    if not zip_file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="File must be a ZIP archive")
    
    # Create temporary directory for extraction
    with tempfile.TemporaryDirectory() as temp_dir:
        zip_path = Path(temp_dir) / zip_file.filename
        
        # Save uploaded file
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(zip_file.file, buffer)
        
        # Extract ZIP contents
        extract_dir = Path(temp_dir) / "extracted"
        extract_dir.mkdir()
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
        except zipfile.BadZipFile:
            raise HTTPException(status_code=400, detail="Invalid ZIP file")
        
        # Find Python and JavaScript files
        supported_extensions = ['.py', '.js']
        file_paths = []
        
        for ext in supported_extensions:
            file_paths.extend(extract_dir.rglob(f'*{ext}'))
        
        if not file_paths:
            raise HTTPException(status_code=400, detail="No Python or JavaScript files found in ZIP")
        
        # Convert to string paths
        file_paths_str = [str(path) for path in file_paths]
        
        try:
            fingerprints, code_chunks, boundaries_dict = run_pipeline_for_files(file_paths_str, llm_chain, embedding_model)
            fingerprints_array = [[int(fp[i]) for i in range(len(fp))] for fp in fingerprints]
            logger.info(f"Generated {len(fingerprints_array)} fingerprints")

            boundaries_json_response = [{
                "filename": filename,
                "boundaries": functions["boundaries"],
                "hashes": functions["hashes"]
            } for filename, functions in boundaries_dict.items()]

            return JSONResponse(content={
                "status": "success",
                "hashes": fingerprints_array,
                "code_chunks": code_chunks,
                "boundaries_json": boundaries_json_response
            })
            
        except Exception as e:
            logger.error(f"Processing error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

class HashComparisonRequest(BaseModel):
    hashes_a: List[str]
    code_chunks_a: List[int] 
    hashes_b: List[str]
    code_chunks_b: List[int]

@app.post("/compare-hashes/")
async def compare_hashes(request: HashComparisonRequest):
    """
    Compares two lists of hashes and returns a similarity score.
    """
    logger.info("Request received for hash comparison")
    
    try:
        final_score, selected_matches = calculate_advanced_score(
            request.hashes_a, 
            request.code_chunks_a, 
            request.hashes_b,
            request.code_chunks_b
        )
        
        logger.info(f"Calculated similarity score: {final_score}")
        
        return JSONResponse(content={
            "status": "success",
            "similarity_score": final_score,
            "selected_matches": selected_matches
        })
        
    except Exception as e:
        logger.error(f"Hash comparison error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Hash comparison error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "server:app", 
        host="0.0.0.0", 
        port=7999, 
        reload=True,
        log_level="debug"
    )