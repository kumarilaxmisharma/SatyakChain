# User Acceptance Testing (UAT) Plan

## CertiChain Platform

**Version:** 1.0 | **Last Updated:** January 2026

---

## 1. Overview

This UAT plan validates that CertiChain meets all functional requirements from the end-user perspective.

## 2. Test Environment

| Component | Configuration |
|-----------|---------------|
| Network | Ethereum Sepolia Testnet |
| Browser | Chrome, Firefox, Safari (latest) |
| Wallet | MetaMask with test ETH |
| Database | PostgreSQL (Docker) |

## 3. Test Cases

### TC-001: Issuer Authentication

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to app | Landing page loads |
| 2 | Click "Connect Wallet" | MetaMask popup appears |
| 3 | Select account and connect | SIWE message displayed |
| 4 | Sign message | Redirected to dashboard |
| 5 | Verify role | User has ISSUER role |

### TC-002: Document Issuance

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Issue Document" | Upload form appears |
| 2 | Fill title and description | Fields validated |
| 3 | Upload PDF file | File preview shown |
| 4 | Enter holder wallet address | Address validated |
| 5 | Click "Issue" | MetaMask transaction popup |
| 6 | Confirm transaction | Loading indicator |
| 7 | Wait for confirmation | Success message, Document ID shown |
| 8 | Check blockchain | NFT minted to holder |

### TC-003: Document Verification (Public)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /verify | Verification page loads |
| 2 | Enter Document ID | ID field accepts input |
| 3 | Click "Verify" | Verification in progress |
| 4 | View result | Shows Valid/Invalid status |
| 5 | See issuer info | Issuer wallet displayed |

### TC-004: Holder Vault Access

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Connect as Holder | SIWE authentication |
| 2 | Navigate to Vault | Vault page loads |
| 3 | View documents | All received docs listed |
| 4 | Click document | Details modal opens |
| 5 | Generate QR code | QR code displayed |
| 6 | Download document | Original file downloads |

### TC-005: Document Revocation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open issued document | Document details shown |
| 2 | Click "Revoke" | Confirmation dialog |
| 3 | Enter reason | Reason field accepts input |
| 4 | Confirm revocation | MetaMask transaction |
| 5 | Wait for confirmation | Document status = REVOKED |
| 6 | Try to verify | Shows "Document Revoked" |

### TC-006: Invalid Document Detection

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Modify original document | Change 1 character |
| 2 | Upload to verification | File accepted |
| 3 | Enter original Document ID | ID accepted |
| 4 | Click "Verify" | Verification runs |
| 5 | View result | Shows INVALID - Hash mismatch |

---

## 4. Edge Cases

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| EC-01 | Upload file > 10MB | Error: File too large |
| EC-02 | Upload .exe file | Error: Invalid file type |
| EC-03 | Invalid wallet address | Error: Invalid address format |
| EC-04 | Network disconnection | Graceful error handling |
| EC-05 | Transaction rejected | Error: Transaction cancelled |
| EC-06 | Session expired | Redirect to login |

---

## 5. Acceptance Criteria

- [ ] All test cases pass
- [ ] No critical bugs
- [ ] Performance within targets
- [ ] Security requirements met
- [ ] Responsive on mobile

---

## 6. Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| QA Lead | | | |
| Tech Lead | | | |
