"use client";

import { useWallet } from "@/lib/wallet-context";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  FileCheck,
  Upload,
  FolderOpen,
  Shield,
  ArrowRight,
  Wallet,
  FileText,
  Users,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { address, isAuthenticated, connect, user } = useWallet();

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-muted-foreground mb-8">
            Connect your MetaMask wallet to access the dashboard and manage your
            documents.
          </p>
          <Button onClick={connect} size="lg" className="gap-2">
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </Button>
        </motion.div>
      </div>
    );
  }

  const isIssuer = user?.role === "ISSUER" || user?.role === "ADMIN";

  return (
    <div className="container py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.name || `${address?.slice(0, 8)}...`}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard/vault">
                <FolderOpen className="w-4 h-4 mr-2" />
                My Vault
              </Link>
            </Button>
            {isIssuer && (
              <Button asChild>
                <Link href="/dashboard/issue">
                  <Upload className="w-4 h-4 mr-2" />
                  Issue Document
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Stats for Issuers */}
        {isIssuer && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="p-4 rounded-xl bg-card border"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-xs text-muted-foreground">Total Issued</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-xl bg-card border"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-4 rounded-xl bg-card border"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-xs text-muted-foreground">Holders</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-xl bg-card border"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-xs text-muted-foreground">Verifications</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group p-6 rounded-2xl bg-card border hover:border-primary/50 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
              <FolderOpen className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Digital Vault</h3>
            <p className="text-muted-foreground text-sm mb-4">
              View all documents issued to your wallet address.
            </p>
            <Button variant="ghost" size="sm" asChild className="gap-1 p-0">
              <Link href="/dashboard/vault">
                Open Vault <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>

          {isIssuer && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="group p-6 rounded-2xl bg-card border hover:border-primary/50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                  <Upload className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Issue Document</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Upload and issue a new document to the blockchain.
                </p>
                <Button variant="ghost" size="sm" asChild className="gap-1 p-0">
                  <Link href="/dashboard/issue">
                    Issue Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="group p-6 rounded-2xl bg-card border hover:border-primary/50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                  <FileText className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Manage Documents</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  View, manage, and revoke documents you've issued.
                </p>
                <Button variant="ghost" size="sm" asChild className="gap-1 p-0">
                  <Link href="/dashboard/documents">
                    View All <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>
            </>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="group p-6 rounded-2xl bg-card border hover:border-primary/50 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
              <Shield className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Verify Document</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Check the authenticity of any CertiChain document.
            </p>
            <Button variant="ghost" size="sm" asChild className="gap-1 p-0">
              <Link href="/verify">
                Verify Now <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Role Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-purple-500/10 border"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Your Role: {user?.role || "HOLDER"}</h3>
              <p className="text-sm text-muted-foreground">
                {user?.role === "ISSUER"
                  ? "You can issue and revoke documents on the blockchain."
                  : user?.role === "ADMIN"
                  ? "You have full administrative access."
                  : "You can view and share documents in your vault."}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
