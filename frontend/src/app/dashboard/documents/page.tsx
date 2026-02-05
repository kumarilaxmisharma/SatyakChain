"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useWallet } from "@/lib/wallet-context";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  Eye,
  Ban,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
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
  holder: { walletAddress: string; name?: string };
  issuedAt?: string;
  createdAt: string;
  tokenId?: string;
};

export default function DocumentsPage() {
  const { isAuthenticated, user } = useWallet();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
    }
  }, [isAuthenticated]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents?role=issuer", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (documentId: string) => {
    if (!confirm("Are you sure you want to revoke this document? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        fetchDocuments();
      }
    } catch (error) {
      console.error("Failed to revoke document:", error);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.holder.walletAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ISSUED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
            <CheckCircle2 className="w-3 h-3" />
            Issued
          </span>
        );
      case "REVOKED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
            <XCircle className="w-3 h-3" />
            Revoked
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            {status}
          </span>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-12 px-4 text-center">
        <p className="text-muted-foreground">Please connect your wallet to view documents.</p>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <Button variant="ghost" asChild className="mb-2">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Issued Documents</h1>
            <p className="text-muted-foreground mt-1">
              Manage documents you've issued on the blockchain
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/issue">
              <Plus className="w-4 h-4 mr-2" />
              Issue New
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or holder address..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-4 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="ISSUED">Issued</option>
            <option value="PENDING">Pending</option>
            <option value="REVOKED">Revoked</option>
          </select>
        </div>

        {/* Documents List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-2xl border">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-6">
              {documents.length === 0
                ? "You haven't issued any documents yet."
                : "No documents match your search."}
            </p>
            {documents.length === 0 && (
              <Button asChild>
                <Link href="/dashboard/issue">Issue Your First Document</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDocuments.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl border bg-card hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{doc.title}</h3>
                        {getStatusBadge(doc.status)}
                      </div>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          Holder: {doc.holder.name || `${doc.holder.walletAddress.slice(0, 8)}...`}
                        </span>
                        <span>
                          {doc.issuedAt ? `Issued ${formatDate(doc.issuedAt)}` : `Created ${formatDate(doc.createdAt)}`}
                        </span>
                        {doc.tokenId && (
                          <span className="text-primary">Token #{doc.tokenId}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreVertical className="w-4 h-4" />
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
                      {doc.tokenId && (
                        <DropdownMenuItem asChild>
                          <a
                            href={`https://sepolia.etherscan.io/token/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}?a=${doc.tokenId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View on Etherscan
                          </a>
                        </DropdownMenuItem>
                      )}
                      {doc.status === "ISSUED" && (
                        <DropdownMenuItem
                          onClick={() => handleRevoke(doc.id)}
                          className="flex items-center gap-2 text-red-500 focus:text-red-500"
                        >
                          <Ban className="w-4 h-4" />
                          Revoke Document
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats */}
        {documents.length > 0 && (
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-muted/30 border text-center">
              <div className="text-2xl font-bold text-green-500">
                {documents.filter((d) => d.status === "ISSUED").length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {documents.filter((d) => d.status === "PENDING").length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border text-center">
              <div className="text-2xl font-bold text-red-500">
                {documents.filter((d) => d.status === "REVOKED").length}
              </div>
              <div className="text-sm text-muted-foreground">Revoked</div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
