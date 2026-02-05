import { ethers } from "ethers";

// Contract ABI (minimal interface for verification)
const CONTRACT_ABI = [
  "function verifyDocument(uint256 tokenId, bytes32 documentHash) view returns (bool isValid, bool isRevoked)",
  "function getDocumentInfo(uint256 tokenId) view returns (bytes32 documentHash, address issuer, address holder, uint256 issuedAt, bool isRevoked, string revocationReason)",
  "function getTokenIdByHash(bytes32 documentHash) view returns (uint256)",
  "function issueDocument(bytes32 documentHash, address holder, string uri) returns (uint256)",
  "function revokeDocument(uint256 tokenId, string reason)",
  "event DocumentIssued(uint256 indexed tokenId, bytes32 indexed documentHash, address indexed issuer, address holder, uint256 timestamp)",
  "event DocumentRevoked(uint256 indexed tokenId, address indexed revoker, string reason, uint256 timestamp)",
];

let provider: ethers.Provider | null = null;
let contract: ethers.Contract | null = null;

export function getProvider(): ethers.Provider {
  if (!provider) {
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    if (!rpcUrl) {
      throw new Error("SEPOLIA_RPC_URL not configured");
    }
    provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  return provider;
}

export function getContract(): ethers.Contract {
  if (!contract) {
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error("CONTRACT_ADDRESS not configured");
    }
    contract = new ethers.Contract(
      contractAddress,
      CONTRACT_ABI,
      getProvider()
    );
  }
  return contract;
}

export async function verifyOnChain(
  tokenId: string,
  documentHash: string
): Promise<{ isValid: boolean; isRevoked: boolean }> {
  const contract = getContract();
  const [isValid, isRevoked] = await contract.verifyDocument(
    tokenId,
    documentHash
  );
  return { isValid, isRevoked };
}

export async function getDocumentFromChain(tokenId: string) {
  const contract = getContract();
  const [documentHash, issuer, holder, issuedAt, isRevoked, revocationReason] =
    await contract.getDocumentInfo(tokenId);

  return {
    documentHash,
    issuer,
    holder,
    issuedAt: Number(issuedAt),
    isRevoked,
    revocationReason,
  };
}

export function hashDocument(buffer: Buffer): string {
  return ethers.keccak256(buffer);
}
