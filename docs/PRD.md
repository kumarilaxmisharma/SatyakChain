# Product Requirements Document (PRD)

## CertiChain: Decentralized Document Verification

**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Active Development

---

## 1. Executive Summary

CertiChain is a high-integrity, decentralized platform for issuing, storing, and verifying digital documents. By anchoring a cryptographic "fingerprint" (SHA-256 hash) of documents to the Ethereum blockchain, CertiChain ensures that any tampering is instantly detectable, eliminating the need for manual verification and trust.

### Problem Statement

Traditional document verification is:
- **Time-consuming:** Manual verification takes days or weeks
- **Fraud-prone:** Documents can be easily forged or altered
- **Centralized:** Single points of failure and data breaches
- **Expensive:** Third-party verification services charge high fees

### Solution

CertiChain provides:
- **Instant verification** via blockchain-anchored hashes
- **Tamper-proof** cryptographic integrity
- **Decentralized** trust model
- **Cost-effective** verification at scale

---

## 2. Product Vision

> "To create a world where every credential is instantly verifiable and fraud is impossible."

### Key Value Propositions

| Value Prop | Description |
|------------|-------------|
| 🔒 **Tamper-Proof** | Even a single character change in a document breaks the cryptographic link |
| ⚡ **Instant Verification** | Employers/Verifiers can validate credentials in seconds via QR or ID |
| 🏦 **Self-Sovereignty** | Users hold their credentials in a "Digital Vault" linked to their Ethereum wallet |
| 🌐 **Universal Access** | Anyone can verify without creating an account |

---

## 3. Target Users

### 3.1 Issuer (Primary User)

**Examples:** Universities, HR Departments, Certification Bodies, Government Agencies

**Needs:**
- Secure document issuance
- Batch document processing
- Revocation capabilities
- Audit trail access

**Pain Points:**
- Current systems are siloed
- No standardized verification method
- Fraud liability concerns

### 3.2 Holder (Primary User)

**Examples:** Students, Professionals, Job Seekers

**Needs:**
- Centralized credential storage
- Easy sharing mechanism
- Privacy controls
- Mobile access

**Pain Points:**
- Documents scattered across emails
- No way to prove authenticity
- Manual verification delays

### 3.3 Verifier (Secondary User)

**Examples:** Recruiters, Employers, Licensing Boards

**Needs:**
- Quick verification
- Trusted source confirmation
- No account required
- API access for automation

**Pain Points:**
- Time-consuming manual checks
- Fake credentials slip through
- No standardized verification

---

## 4. User Stories

### Issuer Stories

| ID | Story | Priority |
|----|-------|----------|
| IS-01 | As an Issuer, I want to connect my MetaMask wallet to authenticate securely | P0 |
| IS-02 | As an Issuer, I want to upload a document and issue it on-chain | P0 |
| IS-03 | As an Issuer, I want to revoke a document if it expires or is rescinded | P0 |
| IS-04 | As an Issuer, I want to view all documents I've issued | P1 |
| IS-05 | As an Issuer, I want to batch-issue multiple documents | P1 |

### Holder Stories

| ID | Story | Priority |
|----|-------|----------|
| HO-01 | As a Holder, I want to view all certificates in my Digital Vault | P0 |
| HO-02 | As a Holder, I want to share a unique QR code for verification | P0 |
| HO-03 | As a Holder, I want to download my original document | P1 |
| HO-04 | As a Holder, I want to see verification history | P2 |

### Verifier Stories

| ID | Story | Priority |
|----|-------|----------|
| VE-01 | As a Verifier, I want to verify a document by ID or QR code | P0 |
| VE-02 | As a Verifier, I want to see the Issuer's verified wallet address | P0 |
| VE-03 | As a Verifier, I want to verify without creating an account | P0 |
| VE-04 | As a Verifier, I want API access for bulk verification | P2 |

---

## 5. Functional Requirements

### 5.1 Authentication

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-01 | System shall support SIWE (Sign-In with Ethereum) | P0 |
| FR-AUTH-02 | System shall verify wallet ownership via signature | P0 |
| FR-AUTH-03 | System shall maintain session for 24 hours | P1 |

### 5.2 Document Issuance

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ISSUE-01 | System shall accept PDF, PNG, JPG documents up to 10MB | P0 |
| FR-ISSUE-02 | System shall generate SHA-256 hash of document | P0 |
| FR-ISSUE-03 | System shall mint ERC-721 NFT with document hash | P0 |
| FR-ISSUE-04 | System shall store document metadata in PostgreSQL | P0 |
| FR-ISSUE-05 | System shall generate unique Document ID | P0 |

### 5.3 Document Verification

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-VERIFY-01 | System shall verify document by ID lookup | P0 |
| FR-VERIFY-02 | System shall verify document by QR code scan | P0 |
| FR-VERIFY-03 | System shall re-hash uploaded document and compare | P0 |
| FR-VERIFY-04 | System shall display verification status (Valid/Invalid/Revoked) | P0 |
| FR-VERIFY-05 | System shall show Issuer wallet address | P0 |

### 5.4 Document Revocation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-REVOKE-01 | System shall allow Issuer to revoke documents | P0 |
| FR-REVOKE-02 | System shall update on-chain revocation status | P0 |
| FR-REVOKE-03 | System shall log revocation reason | P1 |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PERF-01 | Page load time | < 2 seconds |
| NFR-PERF-02 | API response time | < 500ms |
| NFR-PERF-03 | Verification lookup | < 1 second |
| NFR-PERF-04 | Concurrent users | 1000+ |

### 6.2 Security

| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | All API endpoints must be rate-limited |
| NFR-SEC-02 | All inputs must be sanitized and validated |
| NFR-SEC-03 | Smart contracts must follow CEI pattern |
| NFR-SEC-04 | HTTPS required for all connections |

### 6.3 Scalability

| ID | Requirement |
|----|-------------|
| NFR-SCALE-01 | Database must support horizontal scaling |
| NFR-SCALE-02 | API must be stateless for load balancing |
| NFR-SCALE-03 | Frontend must be CDN-deployable |

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Document Issuance Rate | 100+ docs/day | Analytics |
| Verification Success Rate | > 99.9% | Error logs |
| Average Verification Time | < 2 seconds | Performance monitoring |
| User Satisfaction | > 4.5/5 | User surveys |

---

## 8. Timeline

| Milestone | Duration | Deliverables |
|-----------|----------|--------------|
| **Week 1** | 7 days | Smart Contract development, testing, Sepolia deployment |
| **Week 2** | 7 days | Express API, Prisma Schema, Docker containerization |
| **Week 3** | 7 days | Next.js Dashboard, MetaMask (SIWE) integration, Vault UI |
| **Week 4** | 7 days | UI/UX polish, Scalar API docs, README completion |

---

## 9. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Smart contract vulnerability | High | Low | OpenZeppelin standards, audit |
| Blockchain network congestion | Medium | Medium | Gas estimation, retry logic |
| Database breach | High | Low | Encryption, Docker isolation |
| User wallet loss | High | Medium | Document re-issuance process |

---

## 10. Appendix

### Glossary

| Term | Definition |
|------|------------|
| **SIWE** | Sign-In with Ethereum (EIP-4361) |
| **ERC-721** | Ethereum NFT standard |
| **SHA-256** | Cryptographic hash algorithm |
| **CEI** | Checks-Effects-Interactions pattern |

### References

- [EIP-4361: Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethereum Sepolia Testnet](https://sepolia.dev/)
