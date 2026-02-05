"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  Share2,
  FileText,
  Loader2,
} from "lucide-react";

type DocumentInfo = {
  id: string;
  title: string;
  status: string;
};

export default function QRCodePage() {
  const params = useParams();
  const documentId = params.documentId as string;
  const qrRef = useRef<SVGSVGElement>(null);

  const [docInfo, setDocInfo] = useState<DocumentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const verifyUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/verify/${documentId}`
    : "";

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const res = await fetch(`/api/verify/${documentId}`);
      if (res.ok) {
        const data = await res.json();
        setDocInfo(data.document);
      }
    } catch (error) {
      console.error("Failed to fetch document:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    if (!qrRef.current) return;

    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = window.document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = window.document.createElement("a");
      downloadLink.download = `certichain-${documentId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard/documents">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>

        {/* QR Card */}
        <div className="bg-card border rounded-2xl p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">
              {docInfo?.title || "Document QR Code"}
            </h1>
          </div>

          {/* QR Code */}
          <div className="bg-white p-6 rounded-xl inline-block mb-6">
            <QRCodeSVG
              ref={qrRef}
              value={verifyUrl}
              size={200}
              level="H"
              includeMargin={false}
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Scan this QR code to verify the document's authenticity
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={copyLink} className="gap-2">
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </Button>
            <Button onClick={downloadQR} className="gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>

          {/* Verification URL */}
          <div className="mt-6 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground break-all font-mono">
              {verifyUrl}
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-muted/30 rounded-xl text-sm text-muted-foreground">
          <strong className="text-foreground">How to use:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Print this QR code on physical certificates</li>
            <li>Share the verification link via email</li>
            <li>Anyone can scan to verify authenticity</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
