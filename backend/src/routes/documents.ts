import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import prisma from "../lib/prisma";
import { hashDocument } from "../lib/blockchain";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, PNG, JPG allowed."));
    }
  },
});

// POST /api/documents - Issue new document
const issueSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  holderAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

router.post(
  "/",
  authMiddleware,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const { title, description, holderAddress } = issueSchema.parse(req.body);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: { code: "DOC_002", message: "No file uploaded" } });
      }

      // Read file and generate hash
      const fileBuffer = fs.readFileSync(file.path);
      const documentHash = hashDocument(fileBuffer);

      // Check if hash already exists
      const existing = await prisma.document.findUnique({
        where: { documentHash },
      });

      if (existing) {
        fs.unlinkSync(file.path); // Clean up
        return res.status(409).json({ error: { code: "DOC_004", message: "Document already exists" } });
      }

      // Find or create holder
      let holder = await prisma.user.findUnique({
        where: { walletAddress: holderAddress.toLowerCase() },
      });

      if (!holder) {
        holder = await prisma.user.create({
          data: {
            walletAddress: holderAddress.toLowerCase(),
            role: "HOLDER",
          },
        });
      }

      // Create document record
      const document = await prisma.document.create({
        data: {
          documentHash,
          title,
          description,
          fileUrl: file.path,
          fileType: file.mimetype,
          fileSize: file.size,
          status: "PENDING",
          issuerId: req.user!.id,
          holderId: holder.id,
        },
      });

      // Log action
      await prisma.auditLog.create({
        data: {
          action: "DOCUMENT_CREATED",
          entityType: "Document",
          entityId: document.id,
          userId: req.user!.id,
          documentId: document.id,
          metadata: { title, holderAddress },
          ipAddress: req.ip,
        },
      });

      res.status(201).json({
        success: true,
        document: {
          id: document.id,
          documentHash: document.documentHash,
          title: document.title,
          description: document.description,
          status: document.status,
          createdAt: document.createdAt,
        },
        message: "Document created successfully. Status: PENDING until blockchain confirmation.",
      });
    } catch (error) {
      console.error("Document creation error:", error);
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      res.status(500).json({ error: { code: "DOC_ERROR", message: "Failed to create document" } });
    }
  }
);

// GET /api/documents - List documents
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { role = "holder", page = "1", limit = "10" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where =
      role === "issuer"
        ? { issuerId: req.user!.id }
        : { holderId: req.user!.id };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          issuer: { select: { walletAddress: true, name: true } },
          holder: { select: { walletAddress: true, name: true } },
        },
      }),
      prisma.document.count({ where }),
    ]);

    res.json({
      documents,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error("List documents error:", error);
    res.status(500).json({ error: { code: "DOC_ERROR", message: "Failed to list documents" } });
  }
});

// GET /api/documents/:id - Get document details
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: {
        issuer: { select: { walletAddress: true, name: true } },
        holder: { select: { walletAddress: true, name: true } },
      },
    });

    if (!document) {
      return res.status(404).json({ error: { code: "DOC_001", message: "Document not found" } });
    }

    // Check access
    if (document.issuerId !== req.user!.id && document.holderId !== req.user!.id) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Access denied" } });
    }

    res.json(document);
  } catch (error) {
    console.error("Get document error:", error);
    res.status(500).json({ error: { code: "DOC_ERROR", message: "Failed to get document" } });
  }
});

// DELETE /api/documents/:id - Revoke document
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
    });

    if (!document) {
      return res.status(404).json({ error: { code: "DOC_001", message: "Document not found" } });
    }

    if (document.issuerId !== req.user!.id) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only issuer can revoke" } });
    }

    if (document.status === "REVOKED") {
      return res.status(400).json({ error: { code: "DOC_005", message: "Already revoked" } });
    }

    const updated = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revocationReason: reason || "No reason provided",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "DOCUMENT_REVOKED",
        entityType: "Document",
        entityId: document.id,
        userId: req.user!.id,
        documentId: document.id,
        metadata: { reason },
        ipAddress: req.ip,
      },
    });

    res.json({ success: true, document: updated });
  } catch (error) {
    console.error("Revoke error:", error);
    res.status(500).json({ error: { code: "DOC_ERROR", message: "Failed to revoke document" } });
  }
});

export default router;
