"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { BrowserProvider, Eip1193Provider } from "ethers";
import { SiweMessage } from "siwe";

interface WalletContextType {
  address: string | null;
  isConnecting: boolean;
  isAuthenticated: boolean;
  user: User | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
}

interface User {
  id: string;
  walletAddress: string;
  role: string;
  name?: string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setAddress(data.user.walletAddress);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Session check failed:", error);
    }
  };

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask to connect your wallet.");
      return;
    }

    setIsConnecting(true);

    try {
      const provider = new BrowserProvider(window.ethereum as Eip1193Provider);
      const accounts = await provider.send("eth_requestAccounts", []);
      // Use getAddress to ensure checksummed format for SIWE
      const { getAddress } = await import("ethers");
      const walletAddress = getAddress(accounts[0]);
      setAddress(walletAddress);

      // Get nonce from server
      const nonceRes = await fetch("/api/auth/nonce", { credentials: "include" });
      const { nonce } = await nonceRes.json();

      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address: walletAddress,
        statement: "Sign in to CertiChain",
        uri: window.location.origin,
        version: "1",
        chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 11155111,
        nonce,
      });

      const messageToSign = message.prepareMessage();
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(messageToSign);

      // Verify with server
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: messageToSign, signature }),
      });

      if (verifyRes.ok) {
        const data = await verifyRes.json();
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error) {
      console.error("Connection error:", error);
      setAddress(null);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    setAddress(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const signMessage = useCallback(async (message: string) => {
    if (!window.ethereum) throw new Error("No wallet found");

    const provider = new BrowserProvider(window.ethereum as Eip1193Provider);
    const signer = await provider.getSigner();
    return signer.signMessage(message);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnecting,
        isAuthenticated,
        user,
        connect,
        disconnect,
        signMessage,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}
