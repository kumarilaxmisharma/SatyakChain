import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        walletAddress: string;
        role: string;
      };
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionToken = req.cookies.session;

    if (!sessionToken) {
      return res.status(401).json({
        error: { code: "AUTH_002", message: "Authentication required" },
      });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
    });

    if (!session) {
      res.clearCookie("session");
      return res.status(401).json({
        error: { code: "AUTH_002", message: "Invalid session" },
      });
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      res.clearCookie("session");
      return res.status(401).json({
        error: { code: "AUTH_002", message: "Session expired" },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return res.status(401).json({
        error: { code: "AUTH_002", message: "User not found" },
      });
    }

    req.user = {
      id: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      error: { code: "AUTH_ERROR", message: "Authentication error" },
    });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: "AUTH_002", message: "Authentication required" },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Insufficient permissions" },
      });
    }

    next();
  };
}
