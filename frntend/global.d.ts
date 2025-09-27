export interface Window {
  ethereum?: any;
}

export interface BoundaryJson {
  filename: string;
  boundaries: number[];     // adjust type if boundaries are more complex
  hashes: number[][];       // nested arrays of integers
}

export interface JudgeData {
  status: "success" | "error"; // can extend later if needed
  hashes: number[][];          // array of array of integers
  code_chunks: number[];       // array of integers
  boundaries_json: BoundaryJson[];
  hashes2: string[];          // array of strings
}
