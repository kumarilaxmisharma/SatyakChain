"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { useWallet } from "@/lib/wallet-context";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  User,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn, formatFileSize } from "@/lib/utils";

export default function IssueDocumentPage() {
  const router = useRouter();
  const { address, isAuthenticated, user } = useWallet();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [holderAddress, setHolderAddress] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; title: string } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setError(null);
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
    maxSize: 10 * 1024 * 1024,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please upload a document");
      return;
    }

    if (!holderAddress || !holderAddress.startsWith("0x")) {
      setError("Please enter a valid wallet address for the holder");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("holderAddress", holderAddress);
      if (expiresAt) {
        formData.append("expiresAt", expiresAt);
      }

      const res = await fetch("/api/documents", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to issue document");
      }

      setSuccess({ id: data.document.id, title: data.document.title });
      
      // Reset form
      setTitle("");
      setDescription("");
      setHolderAddress("");
      setExpiresAt("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to issue document");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check authentication and role
  if (!isAuthenticated) {
    return (
      <div className="container py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">
            Please connect your wallet to issue documents.
          </p>
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="container py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Document Issued!</h1>
          <p className="text-muted-foreground mb-6">
            "{success.title}" has been successfully issued and recorded on the blockchain.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setSuccess(null)}>
              Issue Another
            </Button>
            <Button asChild>
              <Link href={`/verify/${success.id}`}>View Document</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Issue New Document</h1>
          <p className="text-muted-foreground mt-2">
            Upload a document and issue it as a verifiable credential on the blockchain.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Document File *
            </label>
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : file
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-muted-foreground/30 hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center gap-4">
                  <FileText className="w-10 h-10 text-green-500" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">
                    {isDragActive ? "Drop your file here" : "Drag & drop your document"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PDF, PNG, or JPG (max 10MB)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Document Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Bachelor's Degree in Computer Science"
              required
              className="w-full h-12 px-4 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the document..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Holder Address */}
          <div>
            <label htmlFor="holder" className="block text-sm font-medium mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Holder Wallet Address *
            </label>
            <input
              id="holder"
              type="text"
              value={holderAddress}
              onChange={(e) => setHolderAddress(e.target.value)}
              placeholder="0x..."
              required
              className="w-full h-12 px-4 rounded-xl border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              The Ethereum wallet address of the document recipient
            </p>
          </div>

          {/* Expiration Date (Optional) */}
          <div>
            <label htmlFor="expires" className="block text-sm font-medium mb-2">
              Expiration Date (Optional)
            </label>
            <input
              id="expires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full h-12 px-4 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || !file || !title || !holderAddress}
            className="w-full h-14 text-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Issuing to Blockchain...
              </>
            ) : (
              <>
                <FileCheck className="w-5 h-5 mr-2" />
                Issue Document
              </>
            )}
          </Button>

          {/* Info Box */}
          <div className="p-4 rounded-xl bg-muted/30 border text-sm text-muted-foreground">
            <strong className="text-foreground">What happens when you issue:</strong>
            <ol className="mt-2 space-y-1 list-decimal list-inside">
              <li>Document hash (SHA-256) is computed</li>
              <li>NFT is minted on Ethereum Sepolia</li>
              <li>Document is stored in holder's Digital Vault</li>
              <li>QR code is generated for easy verification</li>
            </ol>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
