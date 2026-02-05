# API Specification

## CertiChain REST API

**Base URL:** `http://localhost:3001/api`  
**Version:** 1.0

---

## Authentication

All protected endpoints require a valid session cookie obtained via SIWE authentication.

---

## Endpoints

### Auth

#### Get Nonce
```
GET /auth/nonce
```
**Response:**
```json
{ "nonce": "abc123xyz" }
```

#### Verify Signature
```
POST /auth/verify
Content-Type: application/json

{
  "message": "SIWE message string",
  "signature": "0x..."
}
```
**Response:**
```json
{
  "success": true,
  "user": {
    "id": "cuid",
    "walletAddress": "0x...",
    "role": "ISSUER"
  }
}
```

#### Logout
```
POST /auth/logout
```

#### Get Current User
```
GET /auth/me
```

---

### Documents

#### Issue Document
```
POST /documents
Content-Type: multipart/form-data

file: <binary>
title: "Certificate Title"
description: "Optional description"
holderAddress: "0x..."
```
**Response:**
```json
{
  "id": "doc_123",
  "documentHash": "0x...",
  "tokenId": "1",
  "txHash": "0x...",
  "status": "ISSUED"
}
```

#### List Documents
```
GET /documents?role=issuer|holder&page=1&limit=10
```

#### Get Document
```
GET /documents/:id
```

#### Revoke Document
```
DELETE /documents/:id
Content-Type: application/json

{ "reason": "Expired license" }
```

#### Download Document
```
GET /documents/:id/download
```

---

### Verification

#### Verify by ID
```
GET /verify/:documentId
```
**Response:**
```json
{
  "isValid": true,
  "isRevoked": false,
  "document": {
    "title": "Certificate Name",
    "issuer": "0x...",
    "holder": "0x...",
    "issuedAt": "2026-01-15T00:00:00Z"
  }
}
```

#### Verify by File Upload
```
POST /verify/hash
Content-Type: multipart/form-data

file: <binary>
documentId: "doc_123"
```

#### Verify by QR Code
```
GET /verify/qr/:code
```

---

### Users

#### Get Vault
```
GET /users/vault
```
**Response:**
```json
{
  "documents": [...],
  "totalIssued": 5,
  "totalReceived": 12
}
```

#### Update Profile
```
PUT /users/profile
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

---

## Error Responses

```json
{
  "error": {
    "code": "DOC_001",
    "message": "Document not found"
  }
}
```

| Code | Description |
|------|-------------|
| AUTH_001 | Invalid signature |
| AUTH_002 | Session expired |
| DOC_001 | Document not found |
| DOC_002 | Invalid file type |
| DOC_003 | File too large |
| VERIFY_001 | Hash mismatch |
| VERIFY_002 | Document revoked |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/auth/*` | 5/15min |
| `/documents` POST | 50/hour |
| `/verify/*` | 100/min |
| General | 1000/hour |
