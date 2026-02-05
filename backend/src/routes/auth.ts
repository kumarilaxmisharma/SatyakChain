import { Router, Request, Response } from "express";
import { generateNonce, SiweMessage } from "siwe";
import prisma from "../lib/prisma";
import { z } from "zod";

const router = Router();

// Store nonces temporarily (in production, use Redis)
// Key by nonce value itself for reliable matching
const nonceStore = new Map<string, number>(); // nonce -> expiresAt

// GET /api/auth/nonce
router.get("/nonce", async (req: Request, res: Response) => {
  try {
    const nonce = generateNonce();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store nonce by its value
    nonceStore.set(nonce, expiresAt);

    res.json({ nonce });
  } catch (error) {
    console.error("Nonce generation error:", error);
    res.status(500).json({ error: { code: "AUTH_ERROR", message: "Failed to generate nonce" } });
  }
});

// POST /api/auth/verify
const verifySchema = z.object({
  message: z.string(),
  signature: z.string(),
});

router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { message, signature } = verifySchema.parse(req.body);

    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });

    if (!fields.success) {
      return res.status(401).json({ error: { code: "AUTH_001", message: "Invalid signature" } });
    }

    // Verify nonce
    const nonceExpiry = nonceStore.get(siweMessage.nonce);
    
    if (!nonceExpiry) {
      return res.status(401).json({ error: { code: "AUTH_001", message: "Invalid nonce" } });
    }

    if (Date.now() > nonceExpiry) {
      nonceStore.delete(siweMessage.nonce);
      return res.status(401).json({ error: { code: "AUTH_002", message: "Nonce expired" } });
    }

    // Clear used nonce
    nonceStore.delete(siweMessage.nonce);

    // Find or create user
    const walletAddress = siweMessage.address.toLowerCase();
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
          role: "HOLDER",
        },
      });
    }

    // Create session token (simplified - use JWT in production)
    const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString("base64");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt,
      },
    });

    // Set cookie
    res.cookie("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Changed from "strict" to allow cross-port requests
      expires: expiresAt,
      path: "/",
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: { code: "AUTH_ERROR", message: "Verification failed" } });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const sessionToken = req.cookies.session;
    
    if (sessionToken) {
      await prisma.session.deleteMany({
        where: { token: sessionToken },
      });
    }

    res.clearCookie("session");
    res.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: { code: "AUTH_ERROR", message: "Logout failed" } });
  }
});

// GET /api/auth/me
router.get("/me", async (req: Request, res: Response) => {
  try {
    const sessionToken = req.cookies.session;
    
    if (!sessionToken) {
      return res.status(401).json({ error: { code: "AUTH_002", message: "Not authenticated" } });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
    });

    if (!session || session.expiresAt < new Date()) {
      res.clearCookie("session");
      return res.status(401).json({ error: { code: "AUTH_002", message: "Session expired" } });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return res.status(401).json({ error: { code: "AUTH_002", message: "User not found" } });
    }

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
    console.error("Auth check error:", error);
    res.status(500).json({ error: { code: "AUTH_ERROR", message: "Auth check failed" } });
  }
});

export default router;
