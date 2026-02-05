import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// GET /api/users/vault - Get user's Digital Vault
router.get("/vault", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const [receivedDocs, issuedDocs, receivedCount, issuedCount] = await Promise.all([
      prisma.document.findMany({
        where: { holderId: userId },
        orderBy: { createdAt: "desc" },
        include: {
          issuer: { select: { walletAddress: true, name: true } },
        },
      }),
      prisma.document.findMany({
        where: { issuerId: userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          holder: { select: { walletAddress: true, name: true } },
        },
      }),
      prisma.document.count({ where: { holderId: userId } }),
      prisma.document.count({ where: { issuerId: userId } }),
    ]);

    res.json({
      vault: {
        received: receivedDocs,
        issued: issuedDocs,
      },
      stats: {
        totalReceived: receivedCount,
        totalIssued: issuedCount,
        activeReceived: receivedDocs.filter((d) => d.status === "ISSUED").length,
        revokedReceived: receivedDocs.filter((d) => d.status === "REVOKED").length,
      },
    });
  } catch (error) {
    console.error("Vault error:", error);
    res.status(500).json({ error: { code: "USER_ERROR", message: "Failed to load vault" } });
  }
});

// PUT /api/users/profile - Update profile
const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

router.put("/profile", authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = profileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
    });

    res.json({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        role: user.role,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: { code: "USER_ERROR", message: "Failed to update profile" } });
  }
});

// GET /api/users/activity - Get user activity
router.get("/activity", authMiddleware, async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({ activity: logs });
  } catch (error) {
    console.error("Activity error:", error);
    res.status(500).json({ error: { code: "USER_ERROR", message: "Failed to load activity" } });
  }
});

export default router;
