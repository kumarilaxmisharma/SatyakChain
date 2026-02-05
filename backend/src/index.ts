import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import documentRoutes from "./routes/documents";
import verifyRoutes from "./routes/verify";
import userRoutes from "./routes/users";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/users", userRoutes);

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err.message);
    res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Internal server error",
      },
    });
  }
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found",
    },
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🔗 CertiChain API Server                        ║
║                                                   ║
║   Port: ${PORT}                                      ║
║   Environment: ${process.env.NODE_ENV || "development"}                   ║
║                                                   ║
║   Endpoints:                                      ║
║   • GET  /health         - Health check           ║
║   • POST /api/auth/*     - Authentication         ║
║   • *    /api/documents  - Document management    ║
║   • GET  /api/verify/*   - Document verification  ║
║   • *    /api/users/*    - User management        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

export default app;
