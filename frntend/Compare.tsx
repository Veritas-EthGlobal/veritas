
import { ethers } from "ethers";


import VerifierABI from "./Verifier.json"; // ABI from compiled contract
// import { groth16 } from "snarkjs"; // in a browser-bundled environment
export default async function CompareFinal(result1: any, result2: any) {
  const contract = await getContract();
  try {
    const tx = await contract.setStrings(JSON.stringify(result1), JSON.stringify(result2));
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}

async function connectWallet() {
  // return new Promise(async (resolve, reject) => {
  //   if (typeof window === "undefined" || !window.ethereum) {
  //     alert("MetaMask not found!");
  //     return resolve(null);
  //   }
    // try {
      await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      try {
        // Try switching to Flow EVM Testnet
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x221" }], 
        });
      } catch (switchError: any) {
        console.log("Asda")
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      return(signer);

}
async function getContract() {
  const signer = await connectWallet();
  return new ethers.Contract(contractAddress, contractABI, signer);
}

const contractAddress = "0xafC3b525C2149B3810d0E2CCb8da75cC03bE8198";

const contractABI = 
  [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "string",
				"name": "first",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "second",
				"type": "string"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "updater",
				"type": "address"
			}
		],
		"name": "StringsUpdated",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "firstString",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getStrings",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "secondString",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_first",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_second",
				"type": "string"
			}
		],
		"name": "setStrings",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

// // Prepare input JSON expected by the circuit:
// // For circuit XorMatrixHamming(n,m,500) the input structure:
// // { A: [[bits...],[...],...], B: [[bits...],...], }
// async function proveInBrowser(A_bits: any, B_bits: any) {
//   // A_bits: array length n of arrays length 500
//   // B_bits: array length m of arrays length 500

//   // build input
//   const input = { A: A_bits, B: B_bits };

//   // fetch wasm & zkey
  // const wasm = "circuit_final.zkey"; // path/url
  // const zkey = "XorMatrixHammnig.wasm";

//   // snarkjs groth16.fullProve accepts a file path or buffer; in browser it fetches
//   const { proof, publicSignals } = await groth16.fullProve(input, wasm, zkey);

//   // proof: object with pi_a, pi_b, pi_c; publicSignals: array of public outputs (OUT[i][j])
//   return { proof, publicSignals };
// }

// async function submitProofOnChain(proof, publicSignals, verifierAddress, signer) {
  // const contract = new ethers.Contract(verifierAddress, VerifierABI, signer);

//   // Convert proof + publicSignals into Solidity input
//   const calldata = await groth16.exportSolidityCallData(proof, publicSignals);
//   const argv = calldata.replace(/["[\]\s]/g, "").split(",").map(v => BigInt(v));

//   const a = [argv[0], argv[1]];
//   const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
//   const c = [argv[6], argv[7]];
//   const pubInputs = argv.slice(8);

//   const ok = await contract.callStatic.verifyProof(a, b, c, pubInputs);
//   console.log("on-chain verification:", ok);
//   return ok;
// }


// import { ethers } from 'ethers';
interface CircuitInput {
  A: number[][];
  B: number[][];
}

interface ProofResult {
  proof: any;
  publicSignals: string[];
}

interface HammingMatrix {
  matrix: number[][];
  proof: any;
  publicSignals: string[];
}

interface CircuitFiles {
  wasmBuffer: ArrayBuffer;
  zkeyBuffer: ArrayBuffer;
  verificationKey: any;
}

// Utility functions
export function parseBinaryString(binaryStr: string): number[] {
  if (!/^[01]+$/.test(binaryStr)) {
    throw new Error('Invalid binary string: must contain only 0s and 1s');
  }
  return binaryStr.split('').map(bit => parseInt(bit, 10));
}

export function parseMatrixInput(
  text: string, 
  expectedRows: number, 
  expectedBits: number
): number[][] {
  const lines = text.trim().split('\n').filter(line => line.trim());
  
  if (lines.length !== expectedRows) {
    throw new Error(`Expected ${expectedRows} rows, got ${lines.length}`);
  }
  
  return lines.map((line, i) => {
    const bits = line.trim();
    if (bits.length !== expectedBits) {
      throw new Error(`Row ${i}: expected ${expectedBits} bits, got ${bits.length}`);
    }
    return parseBinaryString(bits);
  });
}

export function computeHammingDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Arrays must have the same length');
  }
  return a.reduce((sum, bit, i) => sum + (bit ^ b[i]), 0);
}

export function computeHammingMatrix(matrixA: number[][], matrixB: number[][]): number[][] {
  return matrixA.map(rowA => 
    matrixB.map(rowB => computeHammingDistance(rowA, rowB))
  );
}

// ZK Circuit functions
export async function loadCircuitFiles(
  verificationKeyJson: string
): Promise<CircuitFiles> {
  // Hardcode the file names and fetch them as Blobs
  const wasmResponse = await fetch("XorMatrixHamming.wasm");
  if (!wasmResponse.ok) throw new Error("Failed to fetch XorMatrixHamming.wasm");
  const wasmBuffer = await wasmResponse.arrayBuffer();

  const zkeyResponse = await fetch("circuit_final.zkey");
  if (!zkeyResponse.ok) throw new Error("Failed to fetch circuit_final.zkey");
  const zkeyBuffer = await zkeyResponse.arrayBuffer();
  
  let verificationKey;
  try {
    verificationKey = JSON.parse(verificationKeyJson);
  } catch (error) {
    throw new Error('Invalid verification key JSON');
  }
  
  return {
    wasmBuffer,
    zkeyBuffer,
    verificationKey
  };
}

export async function generateZKProof(
  matrixA: number[][],
  matrixB: number[][],
  // circuitFiles: CircuitFiles
): Promise<ProofResult> {
  // Validate inputs
  if (matrixA.length === 0 || matrixB.length === 0) {
    throw new Error('Matrices cannot be empty');
  }
  
  const bits = matrixA[0].length;
  if (matrixB[0].length !== bits) {
    throw new Error('Both matrices must have the same bit length');
  }
  
  // Prepare circuit input
  const circuitInput: CircuitInput = {
    A: matrixA,
    B: matrixB
  };
  
  try {
    const wasmResponse = await fetch("XorMatrixHamming.wasm");
    if (!wasmResponse.ok) throw new Error("Failed to fetch XorMatrixHamming.wasm");
    const wasmBuffer = await wasmResponse.arrayBuffer();

    const zkeyResponse = await fetch("circuit_final.zkey");
    if (!zkeyResponse.ok) throw new Error("Failed to fetch circuit_final.zkey");
    const zkeyBuffer = await zkeyResponse.arrayBuffer();
    // Generate witness and proof using snarkjs
    // Note: This assumes snarkjs is available globally or imported
    const { proof, publicSignals } = await (window as any).snarkjs.groth16.fullProve(
      circuitInput,
      wasmBuffer,
      zkeyBuffer
    );
    
    return { proof, publicSignals };
  } catch (error: any) {
    throw new Error(`Proof generation failed: ${error.message}`);
  }
}

export async function verifyZKProof(
  proof: any,
  publicSignals: string[],
  verificationKey: any
): Promise<boolean> {
  try {
    const isValid = await (window as any).snarkjs.groth16.verify(
      verificationKey,
      publicSignals,
      proof
    );
    return isValid;
  } catch (error: any) {
    throw new Error(`Proof verification failed: ${error.message}`);
  }
}

export async function verifyOnChain(
  contract: ethers.Contract,
  proof: any,
  publicSignals: string[],
  hammingMatrix: number[][]
): Promise<ethers.ContractTransactionResponse> {
  // Format proof for Solidity
  const solidityProof = {
    a: [proof.pi_a[0], proof.pi_a[1]],
    b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
    c: [proof.pi_c[0], proof.pi_c[1]]
  };
  
  // Convert public signals to proper format
  const formattedSignals = publicSignals.map(s => ethers.getBigInt(s));
  
  // Call the verifier contract
  const tx = await contract.verifyHammingMatrix(
    solidityProof.a,
    solidityProof.b,
    solidityProof.c,
    formattedSignals,
    hammingMatrix
  );
  
  return tx;
}

// Main workflow functions
export async function processHammingMatrix(
  matrixAText: string,
  matrixBText: string,
  n: number,
  m: number,
  bits: number,
  // circuitFiles: CircuitFiles
): Promise<HammingMatrix> {
  try {
    // Parse input matrices
    const matrixA = parseMatrixInput(matrixAText, n, bits);
    const matrixB = parseMatrixInput(matrixBText, m, bits);
    
    // Compute expected result locally
    const expectedMatrix = computeHammingMatrix(matrixA, matrixB);
    
    // Generate ZK proof
    const { proof, publicSignals } = await generateZKProof(matrixA, matrixB);
    
    // Read the verification key JSON string from the file
    // Note: In a browser environment, use fetch to load the file
    const verificationKeyResponse = await fetch("verification_key.json");
    if (!verificationKeyResponse.ok) {
      throw new Error("Failed to fetch verification_key.json");
    }
    const verificationKeyJson = await verificationKeyResponse.text();
    // Verify proof locally first
    const isValid = await verifyZKProof(proof, publicSignals, verificationKeyJson);
    // if (!isValid) {
    //   throw new Error('Generated proof is invalid');
    // }
    
    return {
      matrix: expectedMatrix,
      proof,
      publicSignals
    };
  } catch (error: any) {
    throw new Error(`Failed to process hamming matrix: ${error.message}`);
  }
}

export async function setupWeb3Provider(): Promise<{
  provider: ethers.BrowserProvider,
  signer: ethers.Signer
}> {
  if (typeof (window as any).ethereum === 'undefined') {
    throw new Error('MetaMask or compatible wallet not found');
  }
  
  await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
  
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  
  return { provider, signer };
}

// Complete workflow function
export async function completeZKHammingWorkflow(
  matrixAText: string,
  matrixBText: string,
  n: number,
  m: number,
  bits: number,
  // circuitFiles: CircuitFiles,
  // deployContract: boolean = false
): Promise<{
  hammingMatrix: number[][];
  proof: any;
  publicSignals: string[];
  onChainTxHash?: string;
  contractAddress?: string;
}> {
  // Step 1: Generate proof and compute hamming matrix
  const result = await processHammingMatrix(matrixAText, matrixBText, n, m, bits);
  
  let onChainTxHash: string | undefined;
  let contractAddress: string | undefined;
  
  // if (deployContract) {
    try {
      const verifierAddress = "0xF6A7b16bce966D04A2BDc7D029f2FF7668A0C933";
      const { provider, signer } = await setupWeb3Provider();

      const contract = new ethers.Contract(verifierAddress, VerifierABI, signer);
      contractAddress = await contract.getAddress();
      
      // Step 4: Verify on-chain
      const tx = await verifyOnChain(contract, result.proof, result.publicSignals, result.matrix);
      onChainTxHash = tx.hash;
      
      await tx.wait(); // Wait for confirmation
    } catch (error: any) {
      console.warn('On-chain verification failed:', error.message);
    }
  // }
  
  return {
    hammingMatrix: result.matrix,
    proof: result.proof,
    publicSignals: result.publicSignals,
    onChainTxHash,
    contractAddress
  };
}

// Utility function to generate test data
export function generateTestData(n: number, m: number, bits: number): {
  matrixA: string;
  matrixB: string;
} {
  const generateBinaryString = (length: number): string => 
    Array.from({length}, () => Math.floor(Math.random() * 2)).join('');
  
  const matrixA = Array.from({length: n}, () => generateBinaryString(bits)).join('\n');
  const matrixB = Array.from({length: m}, () => generateBinaryString(bits)).join('\n');
  
  return { matrixA, matrixB };
}

// Export types for external use
export type {
  CircuitInput,
  ProofResult,
  HammingMatrix,
  // CircuitFiles
};


export function calculateConfidenceScore(
  rawSimilarity: number,
  activationPoint: number = 0.75,
  steepness: number = 20.0
): number {
  const k = steepness;
  const x0 = activationPoint;
  const x = rawSimilarity;

  // Softplus function: log(1 + exp(x))
  const softplus = (val: number) => Math.log(1 + Math.exp(val));

  // 1. Calculate the transformed value for the current similarity score
  const transformedVal = softplus(k * (x - x0));

  // 2. Calculate the theoretical min/max output for our [0, 1] input range
  // This is needed to normalize the result back to a [0, 1] confidence score.
  const minVal = softplus(k * (0 - x0));
  const maxVal = softplus(k * (1 - x0));

  // 3. Normalize the transformed value
  const confidence = (transformedVal - minVal) / (maxVal - minVal);

  // Clamp the result between 0 and 1 to handle any floating point inaccuracies
  return Math.max(0.0, Math.min(1.0, confidence));
}

export function calculateAdvancedScore(
  fingerprintsA: string[],
  codeChunksA: string[],
  fingerprintsB: string[]
): number {
  if (!fingerprintsA || fingerprintsA.length === 0) {
    return 0.0;
  }

  const reconstructionScores: number[] = [];
  const weights: number[] = [];

  for (let i = 0; i < fingerprintsA.length; i++) {
    const fpA = fingerprintsA[i];
    const weight = codeChunksA[i]?.length ?? 0;
    weights.push(weight);

    const candidateScores: number[] = [];
    if (!fingerprintsB || fingerprintsB.length === 0) {
      reconstructionScores.push(0.0);
      continue;
    }

    for (const fpB of fingerprintsB) {
      // Hamming distance
      // Compute Hamming distance between two fingerprint strings
      let dist = 0;
      if (fpA.length !== fpB.length) {
        // If lengths differ, treat as max distance (all bits differ)
        dist = Math.max(fpA.length, fpB.length);
      } else {
        for (let j = 0; j < fpA.length; j++) {
          if (fpA[j] !== fpB[j]) dist++;
        }
      }
      const rawSim = 1.0 - (dist / fpA.length);

      // Use the confidence score function from above
      const confidence = calculateConfidenceScore(rawSim);
      // Optionally: console.log(rawSim);

      candidateScores.push(confidence);
    }

    const reconstructionScore = Math.min(1.0, candidateScores.reduce((a, b) => a + b, 0));
    reconstructionScores.push(reconstructionScore);
  }

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight === 0) {
    return 0.0;
  }

  let weightedSum = 0;
  for (let i = 0; i < reconstructionScores.length; i++) {
    weightedSum += reconstructionScores[i] * weights[i];
  }

  const finalScore = (weightedSum / totalWeight) * 100;
  return finalScore;
}


// Generate realistic mock proof data
export function generateMockProof(): any {
  return {
    pi_a: [
      "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      "0x1"
    ],
    pi_b: [
      [
        "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')
      ],
      [
        "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')
      ]
    ],
    pi_c: [
      "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      "0x1"
    ],
    protocol: "groth16",
    curve: "bn128"
  };
}

// Generate random binary matrices
export function generateRandomMatrices(n: number, m: number, bits: number): {
  matrixA: number[][];
  matrixB: number[][];
  hammingMatrix: number[][];
} {
  const matrixA: number[][] = [];
  const matrixB: number[][] = [];
  
  // Generate matrix A
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < bits; j++) {
      row.push(Math.random() < 0.5 ? 0 : 1);
    }
    matrixA.push(row);
  }
  
  // Generate matrix B
  for (let i = 0; i < m; i++) {
    const row: number[] = [];
    for (let j = 0; j < bits; j++) {
      row.push(Math.random() < 0.5 ? 0 : 1);
    }
    matrixB.push(row);
  }
  
  // Calculate hamming distances
  const hammingMatrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < m; j++) {
      let distance = 0;
      for (let k = 0; k < bits; k++) {
        if (matrixA[i][k] !== matrixB[j][k]) {
          distance++;
        }
      }
      row.push(distance);
    }
    hammingMatrix.push(row);
  }
  
  return { matrixA, matrixB, hammingMatrix };
}

// Generate mock public signals from hamming matrix
export function generatePublicSignals(hammingMatrix: number[][]): string[] {
  return hammingMatrix.flat().map(distance => distance.toString());
}