# Security Architecture

## CertiChain Platform

**Version:** 1.0 | **Last Updated:** January 2026

---

## 1. Overview

CertiChain implements a **Defense-in-Depth** security strategy across all layers.

## 2. Security Layers

| Layer | Components |
|-------|------------|
| **Network** | HTTPS/TLS 1.3, CORS, Rate limiting |
| **Application** | Input validation, SIWE auth, CSRF protection |
| **Data** | PostgreSQL encryption, Parameterized queries |
| **Blockchain** | OpenZeppelin contracts, RBAC, ReentrancyGuard |
| **Infrastructure** | Docker isolation, Secret management |

## 3. Authentication (SIWE - EIP-4361)

1. Client requests nonce → `GET /api/auth/nonce`
2. Server generates cryptographic nonce (5 min expiry)
3. Client creates SIWE message with domain binding
4. User signs with MetaMask
5. Server verifies signature and issues session

## 4. Smart Contract Security

### Security Standards
- **ERC-721**: OpenZeppelin audited implementation
- **AccessControl**: Role-based permissions
- **ReentrancyGuard**: Prevents reentrancy attacks
- **CEI Pattern**: Checks-Effects-Interactions

### Access Control Matrix

| Function | ADMIN | ISSUER | HOLDER | PUBLIC |
|----------|-------|--------|--------|--------|
| `grantIssuerRole()` | ✅ | ❌ | ❌ | ❌ |
| `issueDocument()` | ✅ | ✅ | ❌ | ❌ |
| `revokeDocument()` | ✅ | ✅* | ❌ | ❌ |
| `verifyDocument()` | ✅ | ✅ | ✅ | ✅ |

*Issuers can only revoke their own documents.

## 5. API Security

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Authentication | 5 req | 15 min |
| Document issuance | 50 req | 1 hour |
| Verification | 100 req | 1 min |

### Input Validation
All inputs validated via **Zod** schemas with strict type checking.

## 6. Data Classification

| Data Type | Classification | Storage |
|-----------|---------------|---------|
| Document content | Confidential | PostgreSQL |
| Document hash | Public | Blockchain |
| User wallet | Public | Both |
| Private keys | Critical | Environment only |

## 7. Threat Mitigations

| Threat | Mitigation |
|--------|------------|
| Document Forgery | SHA-256 hash on blockchain |
| Unauthorized Issuance | ISSUER_ROLE check |
| Session Hijacking | HttpOnly, Secure, SameSite cookies |
| Reentrancy | nonReentrant modifier |
| SQL Injection | Prisma parameterized queries |
