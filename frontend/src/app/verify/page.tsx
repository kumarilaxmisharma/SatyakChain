"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Upload,
  FileText,
  ExternalLink,
  QrCode,
  Camera,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type VerificationResult = {
  isValid: boolean;
  isRevoked: boolean;
  document?: {
    id: string;
    title: string;
    issuer: { walletAddress: string; name?: string };
    holder?: { walletAddress: string };
    status: string;
    issuedAt?: string;
    tokenId?: string;
    txHash?: string;
  };
};

type VerifyTab = "id" | "file" | "qr";

export default function VerifyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<VerifyTab>("id");
  const [documentId, setDocumentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Handle ID verification
  const handleVerifyById = async () => {
    if (!documentId.trim()) return;
    router.push(`/verify/${documentId.trim()}`);
  };

  // Handle file upload verification
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFile(file);
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/verify/file", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Verification failed");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Failed to verify document");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const clearResult = () => {
    setResult(null);
    setError(null);
    setUploadedFile(null);
    setDocumentId("");
  };

  const tabs = [
    { id: "id" as const, label: "Document ID", icon: Search },
    { id: "file" as const, label: "Upload File", icon: Upload },
    { id: "qr" as const, label: "Scan QR", icon: QrCode },
  ];

  return (
    <div className="container py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Verify Document</h1>
          <p className="text-muted-foreground">
            Verify document authenticity using ID, file upload, or QR code scan.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                clearResult();
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {/* ID Search Tab */}
          {activeTab === "id" && (
            <motion.div
              key="id"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyById()}
                    placeholder="Enter Document ID (e.g., cml6peqt30003wey1ldr6ovk3)"
                    className="w-full h-14 pl-12 pr-4 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                  />
                </div>
                <Button
                  onClick={handleVerifyById}
                  disabled={!documentId.trim()}
                  size="lg"
                  className="h-14 px-8"
                >
                  Verify
                </Button>
              </div>

              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  <strong>Tip:</strong> The Document ID is typically found on the
                  certificate itself, in the verification email, or embedded in the QR code.
                </p>
              </div>
            </motion.div>
          )}

          {/* File Upload Tab */}
          {activeTab === "file" && (
            <motion.div
              key="file"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all",
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
                )}
              >
                <input {...getInputProps()} />
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    <p className="text-muted-foreground">Verifying document...</p>
                  </div>
                ) : uploadedFile ? (
                  <div className="flex flex-col items-center">
                    <FileText className="w-12 h-12 text-primary mb-4" />
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                        setResult(null);
                        setError(null);
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">
                      {isDragActive ? "Drop your file here" : "Drag & drop your document"}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      or click to browse (PDF, PNG, JPG - max 10MB)
                    </p>
                  </>
                )}
              </div>

              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  <strong>How it works:</strong> We compute the SHA-256 hash of your file
                  and compare it against hashes stored on the blockchain. The original
                  file content is never stored or transmitted.
                </p>
              </div>
            </motion.div>
          )}

          {/* QR Code Tab */}
          {activeTab === "qr" && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="border-2 border-dashed rounded-2xl p-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">QR Code Scanner</h3>
                <p className="text-muted-foreground mb-6">
                  Scan the QR code on your certificate to instantly verify it.
                </p>
                <Button size="lg" className="gap-2" disabled>
                  <Camera className="w-4 h-4" />
                  Open Camera (Coming Soon)
                </Button>
              </div>

              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> QR codes on CertiChain certificates contain a
                  verification URL. You can also scan the QR code with your phone camera
                  and open the link directly.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Result Display */}
        {(result || error) && activeTab === "file" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            {result && (
              <div
                className={cn(
                  "p-6 rounded-2xl border",
                  result.isValid && !result.isRevoked
                    ? "bg-green-500/10 border-green-500/30"
                    : result.isRevoked
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-red-500/10 border-red-500/30"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      result.isValid && !result.isRevoked
                        ? "bg-green-500/20"
                        : result.isRevoked
                        ? "bg-yellow-500/20"
                        : "bg-red-500/20"
                    )}
                  >
                    {result.isValid && !result.isRevoked ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : result.isRevoked ? (
                      <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">
                      {result.isValid && !result.isRevoked
                        ? "✓ Document Verified"
                        : result.isRevoked
                        ? "⚠ Document Revoked"
                        : "✗ Document Not Found"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {result.isValid && !result.isRevoked
                        ? "This document matches a certificate on the blockchain."
                        : result.isRevoked
                        ? "This document was valid but has been revoked."
                        : "No matching document found on the blockchain."}
                    </p>

                    {result.document && (
                      <div className="space-y-2 pt-4 border-t border-border/50">
                        <p className="text-sm">
                          <strong>Title:</strong> {result.document.title}
                        </p>
                        <p className="text-sm">
                          <strong>Issuer:</strong>{" "}
                          {result.document.issuer.name || result.document.issuer.walletAddress.slice(0, 12)}...
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => router.push(`/verify/${result.document?.id}`)}
                        >
                          View Full Details
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Instructions */}
        <div className="mt-12 p-6 rounded-2xl bg-muted/30 border">
          <h3 className="font-semibold mb-4">How Verification Works</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0">
                1
              </span>
              <span>
                Document hash is computed using SHA-256 cryptographic algorithm
              </span>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0">
                2
              </span>
              <span>
                Hash is compared against records stored on Ethereum blockchain
              </span>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0">
                3
              </span>
              <span>
                If match found, issuer and holder information is retrieved
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
