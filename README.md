# CertiChain: Decentralized Document Verification

<div align="center">

![CertiChain Logo](https://img.shields.io/badge/CertiChain-Blockchain%20Verified-6366f1?style=for-the-badge&logo=ethereum&logoColor=white)

**A high-integrity, decentralized platform for issuing, storing, and verifying digital documents.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=flat-square&logo=solidity)](https://soliditylang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

[📖 Documentation](./docs) · [🚀 Quick Start](#-quick-start) · [🔐 Security](#-security) · [📋 API Docs](./docs/API_Specification.md)

</div>

---

## 📌 Overview

CertiChain bridges the gap between traditional data storage and blockchain immutability. By anchoring a cryptographic **SHA-256 hash** of documents to the **Ethereum blockchain**, CertiChain ensures that any tampering is instantly detectable.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔒 **Tamper-Proof** | Even a single character change breaks the cryptographic link |
| ⚡ **Instant Verification** | Validate credentials in seconds via QR code or Document ID |
| 🏦 **Self-Sovereignty** | Users hold credentials in a "Digital Vault" linked to their Ethereum wallet |
| 🎓 **Multi-Role Support** | Issuers, Holders, and Verifiers each have dedicated workflows |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│              Next.js 14 + TypeScript + Tailwind                  │
│                     + Shadcn/UI + Ethers.js                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          BACKEND                                 │
│                 Express.js + Prisma ORM + Docker                 │
└──────────┬─────────────────────────────────────┬────────────────┘
           │                                     │
           ▼                                     ▼
┌─────────────────────┐             ┌─────────────────────────────┐
│     PostgreSQL      │             │    Ethereum Sepolia         │
│   (Off-chain Data)  │             │     (On-chain Hashes)       │
│                     │             │                             │
│ • Document Content  │             │ • Document Hash (SHA-256)   │
│ • User Metadata     │             │ • Issuer Wallet Address     │
│ • Audit Logs        │             │ • Timestamp (Block)         │
└─────────────────────┘             └─────────────────────────────┘
```

---

## 📁 Project Structure

```
/certichain
├── /contracts           # Solidity smart contracts (Hardhat)
├── /backend             # Express.js API + Prisma ORM
├── /frontend            # Next.js 14 + Shadcn/UI
├── /docs                # Project documentation
│   ├── PRD.md
│   ├── System_Requirements.md
│   ├── Security_Architecture.md
│   ├── API_Specification.md
│   ├── UAT_Plan.md
│   └── Deployment_Guide.md
├── docker-compose.yml   # Docker orchestration
└── README.md            # You are here!
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18.x or v20.x (LTS)
- **pnpm** (Package Manager)
- **Docker** & Docker Compose
- **MetaMask** (connected to Sepolia Testnet)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/certichain.git
cd certichain

# Install all dependencies
pnpm install

# Start infrastructure (PostgreSQL)
docker-compose up -d

# Deploy smart contracts to Sepolia
cd contracts && npx hardhat run scripts/deploy.ts --network sepolia

# Start the backend
cd ../backend && pnpm dev

# Start the frontend (new terminal)
cd ../frontend && pnpm dev
```

### Environment Variables

Create `.env` files in each directory:

**`/contracts/.env`**
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your-deployer-private-key
ETHERSCAN_API_KEY=your-etherscan-key
```

**`/backend/.env`**
```env
DATABASE_URL="postgresql://certichain:certichain@localhost:5432/certichain"
JWT_SECRET=your-super-secret-jwt-key
CONTRACT_ADDRESS=0x...deployed-contract-address
```

**`/frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...deployed-contract-address
NEXT_PUBLIC_CHAIN_ID=11155111
```

---

## 👥 User Roles

### 🎓 Issuer (University, HR, Certification Body)
- Connect MetaMask wallet to authenticate
- Upload documents and issue on-chain certificates
- Revoke credentials when necessary

### 📜 Holder (Student, Professional)
- View all credentials in personal "Digital Vault"
- Share documents via unique QR codes
- Prove ownership through wallet signature

### ✅ Verifier (Recruiter, Employer)
- Verify documents by ID or QR code scan
- View issuer's verified wallet address
- Confirm document hasn't been tampered with

---

## 🔐 Security

CertiChain implements **Defense-in-Depth** across all layers:

| Layer | Protection |
|-------|------------|
| **Smart Contract** | OpenZeppelin ERC721 + AccessControl, CEI Pattern, ReentrancyGuard |
| **Authentication** | SIWE (Sign-In with Ethereum) - EIP-4361 |
| **API** | Rate Limiting, Input Validation (Zod), Helmet.js |
| **Database** | Docker network isolation, Parameterized queries |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [PRD.md](./docs/PRD.md) | Product Requirements Document |
| [System_Requirements.md](./docs/System_Requirements.md) | Technical specifications |
| [Security_Architecture.md](./docs/Security_Architecture.md) | Security implementation details |
| [API_Specification.md](./docs/API_Specification.md) | REST API documentation |
| [UAT_Plan.md](./docs/UAT_Plan.md) | User Acceptance Testing plan |
| [Deployment_Guide.md](./docs/Deployment_Guide.md) | Production deployment guide |

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Shadcn/UI |
| **Backend** | Node.js, Express.js, Prisma ORM |
| **Database** | PostgreSQL 15 |
| **Blockchain** | Solidity 0.8.20, Hardhat, Ethers.js v6 |
| **Infrastructure** | Docker, Docker Compose |
| **Documentation** | Scalar (Interactive API docs) |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for a trustworthy digital future**

</div>
