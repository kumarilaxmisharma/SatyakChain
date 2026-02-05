import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CertiChain - Decentralized Document Verification",
  description:
    "Issue, store, and verify digital documents with blockchain-powered authenticity. Tamper-proof credentials for a trustworthy digital future.",
  keywords: [
    "blockchain",
    "document verification",
    "NFT",
    "credentials",
    "ethereum",
    "decentralized",
  ],
  authors: [{ name: "CertiChain" }],
  openGraph: {
    title: "CertiChain - Decentralized Document Verification",
    description: "Tamper-proof digital credentials on the blockchain",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
