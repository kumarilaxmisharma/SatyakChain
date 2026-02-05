import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import prisma from "../lib/prisma";
import { hashDocument, verifyOnChain, getDocumentFromChain } from "../lib/blockchain";

const router = Router();

// Memory storage for verification uploads (no need to persist)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// GET /api/verify/:documentId - Verify by document ID
router.get("/:documentId", async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    // Find document in database
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        issuer: { select: { walletAddress: true, name: true } },
        holder: { select: { walletAddress: true, name: true } },
      },
    });

    if (!document) {
      return res.status(404).json({
        isValid: false,
        error: { code: "DOC_001", message: "Document not found" },
      });
    }

    // Check on-chain if tokenId exists
    let onChainValid = false;
    let onChainRevoked = false;

    if (document.tokenId) {
      try {
        const result = await verifyOnChain(document.tokenId, document.documentHash);
        onChainValid = result.isValid;
        onChainRevoked = result.isRevoked;
      } catch (error) {
        console.error("On-chain verification failed:", error);
      }
    }

    // Log verification
    await prisma.verification.create({
      data: {
        documentId: document.id,
        verifierIp: req.ip,
        result: document.status === "ISSUED" && !onChainRevoked,
        checkedHash: document.documentHash,
      },
    });

    res.json({
      isValid: document.status === "ISSUED" && onChainValid && !onChainRevoked,
      isRevoked: document.status === "REVOKED" || onChainRevoked,
      document: {
        id: document.id,
        title: document.title,
        description: document.description,
        documentHash: document.documentHash,
        status: document.status,
        issuer: document.issuer,
        holder: document.holder,
        issuedAt: document.issuedAt,
        tokenId: document.tokenId,
        txHash: document.txHash,
      },
      blockchain: {
        verified: document.tokenId ? onChainValid : null,
        tokenId: document.tokenId,
      },
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      isValid: false,
      error: { code: "VERIFY_ERROR", message: "Verification failed" },
    });
  }
});

// POST /api/verify/hash - Verify by file upload
router.post("/hash", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const { documentId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        isValid: false,
        error: { code: "DOC_002", message: "No file uploaded" },
      });
    }

    // Generate hash from uploaded file
    const uploadedHash = hashDocument(file.buffer);

    // Find document if ID provided
    if (documentId) {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          issuer: { select: { walletAddress: true, name: true } },
        },
      });

      if (!document) {
        return res.status(404).json({
          isValid: false,
          uploadedHash,
          error: { code: "DOC_001", message: "Document not found" },
        });
      }

      const hashMatch = uploadedHash === document.documentHash;

      // Log verification
      await prisma.verification.create({
        data: {
          documentId: document.id,
          verifierIp: req.ip,
          result: hashMatch,
          checkedHash: uploadedHash,
        },
      });

      return res.json({
        isValid: hashMatch && document.status === "ISSUED",
        isRevoked: document.status === "REVOKED",
        hashMatch,
        uploadedHash,
        storedHash: document.documentHash,
        document: hashMatch
          ? {
              id: document.id,
              title: document.title,
              issuer: document.issuer,
              status: document.status,
            }
          : null,
      });
    }

    // Search by hash if no ID provided
    const document = await prisma.document.findUnique({
      where: { documentHash: uploadedHash },
      include: {
        issuer: { select: { walletAddress: true, name: true } },
      },
    });

    if (!document) {
      return res.json({
        isValid: false,
        uploadedHash,
        message: "No document found with this hash",
      });
    }

    res.json({
      isValid: document.status === "ISSUED",
      isRevoked: document.status === "REVOKED",
      uploadedHash,
      document: {
        id: document.id,
        title: document.title,
        issuer: document.issuer,
        status: document.status,
      },
    });
  } catch (error) {
    console.error("Hash verification error:", error);
    res.status(500).json({
      isValid: false,
      error: { code: "VERIFY_ERROR", message: "Verification failed" },
    });
  }
});

// POST /api/verify/file - Alias for /hash (for frontend compatibility)
router.post("/file", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        isValid: false,
        error: { code: "DOC_002", message: "No file uploaded" },
      });
    }

    // Generate hash from uploaded file
    const uploadedHash = hashDocument(file.buffer);

    // Search by hash
    const document = await prisma.document.findUnique({
      where: { documentHash: uploadedHash },
      include: {
        issuer: { select: { walletAddress: true, name: true } },
        holder: { select: { walletAddress: true, name: true } },
      },
    });

    if (!document) {
      return res.json({
        isValid: false,
        isRevoked: false,
        uploadedHash,
        message: "No document found with this hash. The file may have been modified or was never registered.",
      });
    }

    // Log verification
    await prisma.verification.create({
      data: {
        documentId: document.id,
        verifierIp: req.ip || "unknown",
        result: document.status === "ISSUED",
        checkedHash: uploadedHash,
      },
    });

    res.json({
      isValid: document.status === "ISSUED",
      isRevoked: document.status === "REVOKED",
      uploadedHash,
      document: {
        id: document.id,
        title: document.title,
        description: document.description,
        issuer: document.issuer,
        holder: document.holder,
        status: document.status,
        issuedAt: document.issuedAt,
        tokenId: document.tokenId,
      },
    });
  } catch (error) {
    console.error("File verification error:", error);
    res.status(500).json({
      isValid: false,
      error: { code: "VERIFY_ERROR", message: "Verification failed" },
    });
  }
});

// GET /api/verify/qr/:code - Verify by QR code
router.get("/qr/:code", async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    // Decode QR code (assuming it contains document ID)
    const documentId = Buffer.from(code, "base64").toString("utf8");

    // Redirect to standard verification
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        issuer: { select: { walletAddress: true, name: true } },
        holder: { select: { walletAddress: true, name: true } },
      },
    });

    if (!document) {
      return res.status(404).json({
        isValid: false,
        error: { code: "DOC_001", message: "Invalid QR code" },
      });
    }

    res.json({
      isValid: document.status === "ISSUED",
      isRevoked: document.status === "REVOKED",
      document: {
        id: document.id,
        title: document.title,
        issuer: document.issuer,
        holder: document.holder,
        status: document.status,
        issuedAt: document.issuedAt,
      },
    });
  } catch (error) {
    console.error("QR verification error:", error);
    res.status(500).json({
      isValid: false,
      error: { code: "VERIFY_ERROR", message: "Invalid QR code" },
    });
  }
});

export default router;
