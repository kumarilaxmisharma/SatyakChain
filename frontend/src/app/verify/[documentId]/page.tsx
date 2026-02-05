"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ExternalLink,
  ArrowLeft,
  User,
  Calendar,
  Hash,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

type VerificationResult = {
  isValid: boolean;
  isRevoked: boolean;
  document?: {
    id: string;
    title: string;
    description?: string;
    documentHash: string;
    issuer: { walletAddress: string; name?: string };
    holder?: { walletAddress: string; name?: string };
    status: string;
    issuedAt?: string;
    tokenId?: string;
    txHash?: string;
  };
};

export default function VerifyDocumentPage() {
  const params = useParams();
  const documentId = params.documentId as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (documentId) {
      verifyDocument();
    }
  }, [documentId]);

  const verifyDocument = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/verify/${documentId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Document not found");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Failed to connect to verification service");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying document...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/verify">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Verify
          </Link>
        </Button>

        {/* Result Card */}
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "rounded-2xl border overflow-hidden",
              result.isValid && !result.isRevoked
                ? "bg-green-500/5 border-green-500/30"
                : result.isRevoked
                ? "bg-yellow-500/5 border-yellow-500/30"
                : "bg-red-500/5 border-red-500/30"
            )}
          >
            {/* Status Header */}
            <div
              className={cn(
                "p-6 border-b",
                result.isValid && !result.isRevoked
                  ? "bg-green-500/10 border-green-500/20"
                  : result.isRevoked
                  ? "bg-yellow-500/10 border-yellow-500/20"
                  : "bg-red-500/10 border-red-500/20"
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center",
                    result.isValid && !result.isRevoked
                      ? "bg-green-500/20"
                      : result.isRevoked
                      ? "bg-yellow-500/20"
                      : "bg-red-500/20"
                  )}
                >
                  {result.isValid && !result.isRevoked ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  ) : result.isRevoked ? (
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-500" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {result.isValid && !result.isRevoked
                      ? "✓ Verified"
                      : result.isRevoked
                      ? "⚠ Revoked"
                      : "✗ Invalid"}
                  </h1>
                  <p className="text-muted-foreground">
                    {result.isValid && !result.isRevoked
                      ? "This document is authentic and has not been tampered with."
                      : result.isRevoked
                      ? "This document was valid but has been revoked by the issuer."
                      : "This document could not be verified."}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Details */}
            {result.document && (
              <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <FileText className="w-4 h-4" />
                    Document Title
                  </div>
                  <p className="text-lg font-semibold">{result.document.title}</p>
                  {result.document.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.document.description}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Issuer */}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Shield className="w-4 h-4" />
                      Issued By
                    </div>
                    <p className="font-medium">
                      {result.document.issuer.name || "Unknown Issuer"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {result.document.issuer.walletAddress.slice(0, 10)}...
                      {result.document.issuer.walletAddress.slice(-8)}
                    </p>
                  </div>

                  {/* Holder */}
                  {result.document.holder && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <User className="w-4 h-4" />
                        Issued To
                      </div>
                      <p className="font-medium">
                        {result.document.holder.name || "Certificate Holder"}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {result.document.holder.walletAddress.slice(0, 10)}...
                        {result.document.holder.walletAddress.slice(-8)}
                      </p>
                    </div>
                  )}

                  {/* Issue Date */}
                  {result.document.issuedAt && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="w-4 h-4" />
                        Issue Date
                      </div>
                      <p className="font-medium">
                        {formatDate(result.document.issuedAt)}
                      </p>
                    </div>
                  )}

                  {/* Document Hash */}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Hash className="w-4 h-4" />
                      Document Hash
                    </div>
                    <p className="text-xs font-mono text-muted-foreground break-all">
                      {result.document.documentHash}
                    </p>
                  </div>
                </div>

                {/* Blockchain Link */}
                {result.document.tokenId && (
                  <div className="pt-4 border-t">
                    <a
                      href={`https://sepolia.etherscan.io/token/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}?a=${result.document.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Etherscan (Token #{result.document.tokenId})
                    </a>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-2xl bg-red-500/10 border border-red-500/30 text-center"
          >
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Document Not Found</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button variant="outline" asChild>
              <Link href="/verify">Try Another Document</Link>
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
