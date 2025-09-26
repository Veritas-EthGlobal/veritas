import os
import re
import numpy as np
import math
import subprocess
from collections import OrderedDict
import requests

# LangChain components for local model integration
from langchain_community.chat_models import ChatOllama
from langchain_community.embeddings import OllamaEmbeddings
from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableSequence, RunnableLambda

# pyminifier for robust code obfuscation
from minifier_code import obfuscate_code
from extract_functions import extract_functions_from_content_python, extract_functions_from_content_js
from pseudocode_prompt import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, PSEUDOCODE_PROMPT
from function_boundaries import identify_function_boundaries_python, identify_function_boundaries_js
from dotenv import load_dotenv

# --- CONFIGURATION ---
# Set the name of the self-hosted model you are running with Ollama
OLLAMA_MODEL = "deepseek-coder-v2"
load_dotenv()
ASI_KEY = os.getenv("ASI_KEY") # Your script will load this from .env
ASI_CHAT_MODEL = "asi1-mini"   # Or any other model your API provides
USE_REMOTE_API = False

# --- SCORING ALGORITHM PARAMETERS ---

SOFTPLUS_ACTIVATION_POINT = 0.75 # The raw similarity score where the curve really "takes off"
SOFTPLUS_STEEPNESS = 20.0 # Controls how sharp the "knee" of the curve is

VISUALIZE_MATCH_THRESHOLD = 0.1

def transform_numbers(x, midpoint=0.42, gamma=9):
    print(x)
    if x <= midpoint:
        y = midpoint * (x / midpoint) ** gamma
    else:
        y = 1 - (1 - midpoint) * ((1 - x) / (1 - midpoint)) ** gamma        
    return y

def calculate_confidence_score(raw_similarity: float) -> float:
    """
    Converts raw bit-similarity into a meaningful confidence score using a
    scaled and shifted Softplus function. This provides a smooth "soft knee"
    that transitions into a near-linear ramp.
    """
    k = SOFTPLUS_STEEPNESS
    x0 = SOFTPLUS_ACTIVATION_POINT
    x = raw_similarity

    # Softplus function: log(1 + exp(x))
    softplus = lambda val: math.log(1 + math.exp(val))

    # 1. Calculate the transformed value for the current similarity score
    transformed_val = softplus(k * (x - x0))

    # 2. Calculate the theoretical min/max output for our [0, 1] input range
    # This is needed to normalize the result back to a [0, 1] confidence score.
    min_val = softplus(k * (0 - x0))
    max_val = softplus(k * (1 - x0))

    # 3. Normalize the transformed value
    confidence = (transformed_val - min_val) / (max_val - min_val)
    
    # Clamp the result between 0 and 1 to handle any floating point inaccuracies
    return max(0.0, min(1.0, confidence))


def extract_functions_from_files(filepaths: list[str]) -> tuple[list[str], dict[str, list[tuple[int, int]]]]:
    """
    Step 0: Reads one or more Python files and extracts all top-level
    functions using an indentation-based approach.
    """
    content = ""
    boundaries_dict = OrderedDict()
    for filepath in filepaths:
        print(f"  - Reading and parsing {filepath}...")
        with open(filepath, 'r') as f:
            file = f.read()
        language = 'python' if filepath.endswith('.py') else 'javascript'

        if language == 'python':
            # Use the new helper to extract functions from the content
            boundaries = identify_function_boundaries_python(file)
            boundaries_dict[os.path.basename(filepath)] = boundaries
        else:
            boundaries = identify_function_boundaries_js(file)
            boundaries_dict[os.path.basename(filepath)] = boundaries
            
        content += file + "\n"
    
    obfuscated_content = obfuscate_code(content, language=language)

    if language == 'python':
        all_functions = extract_functions_from_content_python(obfuscated_content)
    else:
        all_functions = extract_functions_from_content_js(obfuscated_content)

    return all_functions, boundaries_dict


def generate_pseudocode(obfuscated_code: str, llm_chain) -> str:
    """
    Tool 2: Uses the LangChain chain to convert obfuscated code to pseudocode.
    """
    response = llm_chain.invoke({"obfuscated_code": obfuscated_code})
    return response


def generate_embedding(pseudocode: str, embedding_model) -> np.ndarray:
    """
    Tool 3: Converts the pseudocode text into a numerical vector embedding.
    """
    embedding_list = embedding_model.embed_query(pseudocode)
    return np.array(embedding_list)

def generate_fingerprint(embedding_vector: np.ndarray) -> str:
    """
    Tool 4: Converts the embedding vector into a binary hash string based on sign.
    """
    binary_array = (embedding_vector >= 0).astype(int)
    return "".join(binary_array.astype(str))

def hamming_distance(fingerprint1: str, fingerprint2: str) -> int:
    """
    Calculates the number of differing bits between two binary strings.
    """
    # Ensure fingerprints are the same length for comparison
    if len(fingerprint1) != len(fingerprint2):
        # This can happen if the embedding models produce different dimensions.
        # Handle this gracefully, e.g., by returning a max distance.
        return len(fingerprint1) 
    return np.sum(np.array(list(fingerprint1)) != np.array(list(fingerprint2)))


def calculate_advanced_score(
    fingerprints_a: list, 
    code_chunks_a: list, 
    fingerprints_b: list,
    code_chunks_b: list
) -> float:
    """
    Calculates the final, advanced similarity score using the Reconstruction Model
    with Code Length Weighting and the Sigmoid confidence score.
    """
    if not fingerprints_a:
        return 0.0

    reconstruction_scores = []
    weights = []
    candidate_score_matrix = []

    for i, fp_a in enumerate(fingerprints_a):
        weight = len(code_chunks_a[i])
        weights.append(weight)
        
        candidate_scores = []
        if not fingerprints_b:
            reconstruction_scores.append(0.0)
            continue
            
        for fp_b in fingerprints_b:
            dist = hamming_distance(fp_a, fp_b)
            raw_sim = 1.0 - (dist / len(fp_a))
            
            # Convert raw similarity to a meaningful confidence score
            confidence = calculate_confidence_score(raw_sim)
            
            # Add to candidate set if its confidence is significant
            candidate_scores.append(confidence)

        candidate_score_matrix.append(candidate_scores)
        reconstruction_score = min(1.0, sum(candidate_scores))
        reconstruction_scores.append(reconstruction_score)

    for vector in candidate_score_matrix:
        print(vector)
        
    weighted_sum = np.array(reconstruction_scores) * np.array(weights)

    selected_matches = []
    potential_matches = []
    for i, row in enumerate(candidate_score_matrix):
        for j, score in enumerate(row):
            if score > VISUALIZE_MATCH_THRESHOLD:
                potential_matches.append((score, i, j))
    
    potential_matches.sort(reverse=True, key=lambda x: x[0])
    
    used_rows = set()
    used_cols = set()
    
    for score, row, col in potential_matches:
        if row not in used_rows and col not in used_cols:
            selected_matches.append((score, row, col))
            used_rows.add(row)
            used_cols.add(col)

    weighted_sum = sum(weighted_sum)
    total_weight = sum(weights)
    
    final_score = (weighted_sum / total_weight)
    final_score = transform_numbers(final_score) * 100

    if final_score < 0.8:
        selected_matches = []
    return final_score, selected_matches

def run_pipeline_for_files(filepaths: list[str], llm_chain, embedding_model) -> tuple[list[str], list[str]]:
    """
    Orchestrates the fingerprinting process and returns both fingerprints and original code chunks.
    """
    print(f"\nProcessing file: {filepaths}...")
    
    functions, boundaries = extract_functions_from_files(filepaths)
    
    print(f"Found {len(functions)} function(s). Generating fingerprints...")
    fingerprints = []
    for i, func_code in enumerate(functions):
        pseudocode = generate_pseudocode(func_code, llm_chain)
        print(f"\nFunction {i+1} Pseudocode:\n{pseudocode}\n")
        if not pseudocode:
              print(f"  - Failed to generate pseudocode for function {i+1}. Skipping.")
              continue
        embedding = generate_embedding(pseudocode, embedding_model)
        fingerprint = generate_fingerprint(embedding)
        fingerprints.append(fingerprint)
        print(f"  - Fingerprint generated for function {i+1}.")
    
    assert sum(len(x) for x in boundaries.values()) == len(fingerprints), f"Found {len(fingerprints)} fingerprints but {sum(len(x) for x in boundaries.values())} functions in boundaries"

    queue = fingerprints.copy()

    for file_name, function in boundaries.items():
        count = len(function)
        boundaries[file_name] = {
            "hashes": [queue.pop(0)  for _ in range(count)],
            "boundaries": function
        }
    assert fingerprints == [x for hashes in boundaries.values() for x in hashes["hashes"]], "Correspondence error in boundaries"
    return fingerprints, functions, boundaries

def chat_remote(message: str, system_prompt: str, model_name: str) -> str:
    # (Your well-written chat function is placed here)
    if not ASI_KEY: raise ValueError("ASI_KEY environment variable is not set")
    # ... (rest of your chat function logic) ...
    url = "https://api.asi1.ai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {ASI_KEY}", "Content-Type": "application/json"}
    body = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ],
        "response_format": { "type": "text" }
    }
    try:
        response = requests.post(url, headers=headers, json=body, timeout=30)
        response.raise_for_status()
        response_data = response.json()
        print(response_data)
        return response_data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Error calling remote API: {e}")
        return ""


def generate_chain():
    """
    Acts as a switchboard to initialize and return the correct LLM chain
    and embedding model based on the USE_REMOTE_API flag.
    """
    print(f"--- Configuration: USE_REMOTE_API is set to {USE_REMOTE_API} ---")

    if USE_REMOTE_API:
        # --- Remote API (asi1.ai) Path ---
        if not ASI_KEY:
            raise ValueError("To use the remote API, the ASI_KEY environment variable must be set.")
        
        print(f"Using remote API model: {ASI_CHAT_MODEL}")

        # 1. We create a prompt template for the user message part
        prompt = PromptTemplate.from_template(USER_PROMPT_TEMPLATE)
        
        # 2. We define a function that will be wrapped by LangChain.
        # This function now correctly formats the prompt before calling the API.
        def remote_llm_func(inputs: dict) -> str:
            # Format the user part of the prompt with the code
            formatted_user_prompt = prompt.format(**inputs)
            
            # Call your original, unchanged chat_remote function
            return chat_remote(
                message=formatted_user_prompt, # The fully formatted message
                system_prompt=SYSTEM_PROMPT,     # The static system instructions
                model_name=ASI_CHAT_MODEL
            )

        # 3. We wrap our new function in a RunnableLambda and add the parser
        llm_chain = RunnableLambda(remote_llm_func) | StrOutputParser()

    else:
        # --- Local Ollama Path (Unchanged) ---
        print(f"Using local Ollama model: {OLLAMA_MODEL}")
        
        # We combine the two prompts for the local model
        full_prompt_template = PSEUDOCODE_PROMPT
        prompt = PromptTemplate.from_template(full_prompt_template)
        
        llm = ChatOllama(model=OLLAMA_MODEL, temperature=0)
        llm_chain = RunnableSequence(prompt, llm, StrOutputParser())

    embedding_model = OllamaEmbeddings(model=OLLAMA_MODEL)
    return llm_chain, embedding_model

# --- MAIN EXECUTION ---
if __name__ == "__main__":
    print("Initializing CodeWitness Agent with local models via LangChain...")

    llm_chain, embedding_model = generate_chain()
    
    file_a_paths = ['example_codes/pagerank_v1_p1.py', 'example_codes/pagerank_v1_p2.py']
    file_b_paths = ['example_codes/pagerank_v2.js']

    fingerprints_a, code_chunks_a, boundaries = run_pipeline_for_files(file_a_paths, llm_chain, embedding_model)
    print("#############################")
    fingerprints_b, code_chunks_b, boundaries = run_pipeline_for_files(file_b_paths, llm_chain, embedding_model) # We don't need code_b chunks

    if fingerprints_a and fingerprints_b:
        final_score, selected_matches = calculate_advanced_score(fingerprints_a, code_chunks_a, fingerprints_b, code_chunks_b)
        print("\n--- ANALYSIS COMPLETE ---")
        print(f"Found {len(fingerprints_a)} proprietary functions in '{file_a_paths}'")
        print(f"Found {len(fingerprints_b)} functions in suspect file '{file_b_paths}'")
        print(f"\nAdvanced Similarity Score: {final_score:.2f}%")
    else:
        print("\nCould not perform analysis. One or both files had no functions, or an error occurred during processing.")