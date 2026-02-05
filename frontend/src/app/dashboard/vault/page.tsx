"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useWallet } from "@/lib/wallet-context";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Eye,
  QrCode,
  Download,
  Share2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatDate } from "@/lib/utils";

type Document = {
  id: string;
  title: string;
  description?: string;
  status: "PENDING" | "ISSUED" | "REVOKED" | "EXPIRED";
  issuer: { walletAddress: string; name?: string };
  issuedAt?: string;
  createdAt: string;
  tokenId?: string;
  expiresAt?: string;
};

export default function VaultPage() {
  const { isAuthenticated } = useWallet();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
    }
  }, [isAuthenticated]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/users/vault", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        // Backend returns { vault: { received: [...], issued: [...] } }
        setDocuments(data.vault?.received || []);
      }
    } catch (error) {
      console.error("Failed to fetch vault:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ISSUED":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "REVOKED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ISSUED":
        return "border-green-500/30 bg-green-500/5";
      case "REVOKED":
        return "border-red-500/30 bg-red-500/5";
      case "PENDING":
        return "border-yellow-500/30 bg-yellow-500/5";
      default:
        return "";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-12 px-4 text-center">
        <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          Please connect your wallet to access your Digital Vault.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-2">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Digital Vault</h1>
              <p className="text-muted-foreground">
                Your verified credentials and certificates
              </p>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-2xl border">
            <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your vault is empty</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              When organizations issue documents to your wallet address, they'll appear
              here. You can then share and verify them anytime.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "group p-5 rounded-xl border bg-card hover:shadow-lg transition-all",
                  getStatusColor(doc.status)
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {getStatusIcon(doc.status)}
                    </div>
                    <div>
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          doc.status === "ISSUED" && "bg-green-500/20 text-green-500",
                          doc.status === "REVOKED" && "bg-red-500/20 text-red-500",
                          doc.status === "PENDING" && "bg-yellow-500/20 text-yellow-500"
                        )}
                      >
                        {doc.status}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/verify/${doc.id}`} className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/document/${doc.id}/qr`} className="flex items-center gap-2">
                          <QrCode className="w-4 h-4" />
                          Show QR Code
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/verify/${doc.id}`
                          );
                        }}
                        className="flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Copy Share Link
                      </DropdownMenuItem>
                      {doc.tokenId && (
                        <DropdownMenuItem asChild>
                          <a
                            href={`https://sepolia.etherscan.io/token/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}?a=${doc.tokenId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Etherscan
                          </a>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Content */}
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{doc.title}</h3>
                {doc.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {doc.description}
                  </p>
                )}

                {/* Footer */}
                <div className="pt-4 border-t border-border/50 space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Issued by</span>
                    <span className="font-medium text-foreground">
                      {doc.issuer.name || `${doc.issuer.walletAddress.slice(0, 8)}...`}
                    </span>
                  </div>
                  {doc.issuedAt && (
                    <div className="flex justify-between">
                      <span>Date</span>
                      <span>{formatDate(doc.issuedAt)}</span>
                    </div>
                  )}
                  {doc.expiresAt && (
                    <div className="flex justify-between">
                      <span>Expires</span>
                      <span className={new Date(doc.expiresAt) < new Date() ? "text-red-500" : ""}>
                        {formatDate(doc.expiresAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* View Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  asChild
                >
                  <Link href={`/verify/${doc.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Certificate
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
