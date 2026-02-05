# System Requirements Specification (SRS)

## CertiChain Platform

**Version:** 1.0  
**Last Updated:** January 2026

---

## 1. Introduction

### 1.1 Purpose

This document specifies the complete system requirements for CertiChain, a decentralized document verification platform. It defines the technical architecture, data models, integrations, and development specifications.

### 1.2 Scope

CertiChain consists of three primary subsystems:
1. **Smart Contracts** - Solidity contracts on Ethereum Sepolia
2. **Backend API** - Node.js/Express with PostgreSQL
3. **Frontend** - Next.js 14 web application

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐       │
│  │   Web Browser   │    │   Mobile Web    │    │   Third-Party   │       │
│  │   (Next.js)     │    │   (PWA Ready)   │    │   (API Client)  │       │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘       │
└───────────┼──────────────────────┼──────────────────────┼────────────────┘
            │                      │                      │
            ▼                      ▼                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                    │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │                     Express.js REST API                            │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │   │
│  │  │  Auth   │  │ Document│  │ Verify  │  │  User   │  │  Audit  │  │   │
│  │  │ Routes  │  │ Routes  │  │ Routes  │  │ Routes  │  │ Routes  │  │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │    Ethereum     │  │   File Storage  │
│   (Metadata)    │  │   (Blockchain)  │  │   (Documents)   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | Next.js | 14.x |
| | TypeScript | 5.x |
| | Tailwind CSS | 3.x |
| | Shadcn/UI | Latest |
| | Ethers.js | 6.x |
| **Backend** | Node.js | 20.x LTS |
| | Express.js | 4.x |
| | Prisma ORM | 5.x |
| | TypeScript | 5.x |
| **Database** | PostgreSQL | 15.x |
| **Blockchain** | Solidity | 0.8.20 |
| | Hardhat | 2.x |
| | OpenZeppelin | 5.x |
| **Infrastructure** | Docker | 24.x |
| | Docker Compose | 2.x |

---

## 3. Data Models

### 3.1 PostgreSQL Schema

```prisma
// User Model
model User {
  id            String      @id @default(cuid())
  walletAddress String      @unique
  role          UserRole    @default(HOLDER)
  name          String?
  email         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  issuedDocs    Document[]  @relation("IssuedDocuments")
  receivedDocs  Document[]  @relation("ReceivedDocuments")
  auditLogs     AuditLog[]
}

enum UserRole {
  ADMIN
  ISSUER
  HOLDER
}

// Document Model
model Document {
  id              String         @id @default(cuid())
  documentHash    String         @unique
  title           String
  description     String?
  fileUrl         String
  fileType        String
  fileSize        Int
  tokenId         String?        @unique
  txHash          String?
  status          DocumentStatus @default(PENDING)
  issuedAt        DateTime?
  expiresAt       DateTime?
  revokedAt       DateTime?
  revocationReason String?
  
  issuerId        String
  issuer          User           @relation("IssuedDocuments", fields: [issuerId], references: [id])
  
  holderId        String
  holder          User           @relation("ReceivedDocuments", fields: [holderId], references: [id])
  
  verifications   Verification[]
  auditLogs       AuditLog[]
  
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([documentHash])
  @@index([tokenId])
  @@index([issuerId])
  @@index([holderId])
}

enum DocumentStatus {
  PENDING
  ISSUED
  REVOKED
  EXPIRED
}

// Verification Model
model Verification {
  id           String   @id @default(cuid())
  documentId   String
  document     Document @relation(fields: [documentId], references: [id])
  verifierIp   String?
  result       Boolean
  checkedHash  String
  createdAt    DateTime @default(now())

  @@index([documentId])
}

// Audit Log Model
model AuditLog {
  id          String   @id @default(cuid())
  action      String
  entityType  String
  entityId    String
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  documentId  String?
  document    Document? @relation(fields: [documentId], references: [id])
  metadata    Json?
  ipAddress   String?
  createdAt   DateTime @default(now())

  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
}
```

### 3.2 Blockchain Data (On-Chain)

```solidity
struct DocumentCertificate {
    bytes32 documentHash;    // SHA-256 hash
    address issuer;          // Issuer wallet address
    address holder;          // Holder wallet address
    uint256 issuedAt;        // Block timestamp
    bool isRevoked;          // Revocation status
}
```

---

## 4. API Specification

### 4.1 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/nonce` | Get SIWE nonce |
| POST | `/api/auth/verify` | Verify SIWE signature |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Get current user |

### 4.2 Document Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents` | Issue new document |
| GET | `/api/documents` | List user's documents |
| GET | `/api/documents/:id` | Get document details |
| DELETE | `/api/documents/:id` | Revoke document |
| GET | `/api/documents/:id/download` | Download original file |

### 4.3 Verification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/verify/:documentId` | Verify by Document ID |
| POST | `/api/verify/hash` | Verify by file upload |
| GET | `/api/verify/qr/:code` | Verify by QR code |

### 4.4 User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/vault` | Get user's Digital Vault |
| PUT | `/api/users/profile` | Update user profile |

---

## 5. Smart Contract Specification

### 5.1 Contract Interface

```solidity
interface ICertiChain {
    // Events
    event DocumentIssued(
        uint256 indexed tokenId,
        bytes32 indexed documentHash,
        address indexed issuer,
        address holder
    );
    
    event DocumentRevoked(
        uint256 indexed tokenId,
        address indexed revoker,
        string reason
    );

    // Functions
    function issueDocument(
        bytes32 documentHash,
        address holder,
        string calldata tokenURI
    ) external returns (uint256 tokenId);

    function revokeDocument(
        uint256 tokenId,
        string calldata reason
    ) external;

    function verifyDocument(
        uint256 tokenId,
        bytes32 documentHash
    ) external view returns (bool isValid, bool isRevoked);

    function getDocumentInfo(
        uint256 tokenId
    ) external view returns (
        bytes32 documentHash,
        address issuer,
        address holder,
        uint256 issuedAt,
        bool isRevoked
    );
}
```

### 5.2 Access Control

| Role | Permissions |
|------|-------------|
| `DEFAULT_ADMIN_ROLE` | Grant/revoke issuer role |
| `ISSUER_ROLE` | Issue and revoke documents |
| Token Owner | Transfer, view owned documents |

---

## 6. Integration Requirements

### 6.1 MetaMask Integration

- Support for Ethereum Sepolia (Chain ID: 11155111)
- EIP-1193 provider detection
- Transaction signing for document issuance
- Message signing for SIWE authentication

### 6.2 File Storage

| Requirement | Specification |
|-------------|---------------|
| Supported formats | PDF, PNG, JPG, JPEG |
| Maximum file size | 10 MB |
| Storage location | Local filesystem (development) |
| Production storage | AWS S3 / IPFS (future) |

---

## 7. Development Requirements

### 7.1 Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18.x or 20.x LTS |
| pnpm | 8.x |
| Docker | 24.x |
| Docker Compose | 2.x |
| MetaMask | Latest |

### 7.2 Development Scripts

```bash
# Root level
pnpm install          # Install all dependencies
pnpm dev              # Start all services

# Contracts
cd contracts
pnpm compile          # Compile contracts
pnpm test             # Run tests
pnpm deploy:sepolia   # Deploy to Sepolia

# Backend
cd backend
pnpm dev              # Start dev server
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Prisma Studio

# Frontend
cd frontend
pnpm dev              # Start Next.js dev
pnpm build            # Production build
pnpm lint             # Run ESLint
```

### 7.3 Port Allocation

| Service | Port |
|---------|------|
| Frontend (Next.js) | 3000 |
| Backend (Express) | 3001 |
| PostgreSQL | 5432 |
| Adminer | 8080 |

---

## 8. Testing Requirements

### 8.1 Unit Tests

| Component | Framework | Coverage Target |
|-----------|-----------|-----------------|
| Smart Contracts | Hardhat/Chai | 100% |
| Backend API | Jest/Supertest | 80% |
| Frontend | Jest/RTL | 70% |

### 8.2 Integration Tests

- End-to-end document issuance flow
- Verification flow with on-chain validation
- SIWE authentication flow

---

## 9. Deployment Requirements

### 9.1 Environments

| Environment | Purpose | Blockchain |
|-------------|---------|------------|
| Development | Local development | Hardhat Network |
| Staging | Testing | Sepolia Testnet |
| Production | Live | Ethereum Mainnet |

### 9.2 Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Vercel  │    │ Railway  │    │ Supabase │              │
│  │ Frontend │◄──►│ Backend  │◄──►│PostgreSQL│              │
│  └──────────┘    └──────────┘    └──────────┘              │
│                        │                                     │
│                        ▼                                     │
│                 ┌──────────────┐                            │
│                 │   Alchemy    │                            │
│                 │  (RPC Node)  │                            │
│                 └──────────────┘                            │
│                        │                                     │
│                        ▼                                     │
│                 ┌──────────────┐                            │
│                 │   Ethereum   │                            │
│                 │   Mainnet    │                            │
│                 └──────────────┘                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Appendix

### 10.1 Error Codes

| Code | Description |
|------|-------------|
| `AUTH_001` | Invalid signature |
| `AUTH_002` | Session expired |
| `DOC_001` | Document not found |
| `DOC_002` | Invalid file type |
| `DOC_003` | File too large |
| `DOC_004` | Document already exists |
| `VERIFY_001` | Hash mismatch |
| `VERIFY_002` | Document revoked |
| `CHAIN_001` | Transaction failed |
| `CHAIN_002` | Insufficient gas |

### 10.2 Environment Variables

See [Deployment_Guide.md](./Deployment_Guide.md) for complete environment variable documentation.
