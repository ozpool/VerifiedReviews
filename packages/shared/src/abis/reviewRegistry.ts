// Generated from packages/contracts artifacts. Do not edit by hand.
// Regenerate with: pnpm -F @vr/contracts export-abis
export const reviewRegistryAbi = [
  {
    "inputs": [
      {
        "internalType": "contract VisitProofSBT",
        "name": "sbt_",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "starRating",
        "type": "uint8"
      }
    ],
    "name": "InvalidRating",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "reviewer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "businessId",
        "type": "uint256"
      }
    ],
    "name": "NoVisitProof",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "visitedAt",
        "type": "uint64"
      },
      {
        "internalType": "uint256",
        "name": "nowTs",
        "type": "uint256"
      }
    ],
    "name": "VisitTooOld",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "businessId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "reviewer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "contentHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "starRating",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ReviewSubmitted",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "RECENCY_WINDOW",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "sbt",
    "outputs": [
      {
        "internalType": "contract VisitProofSBT",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "businessId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "contentHash",
        "type": "bytes32"
      },
      {
        "internalType": "uint8",
        "name": "starRating",
        "type": "uint8"
      }
    ],
    "name": "submit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
