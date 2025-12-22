"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/utils/trpc";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<any>;
    };
  }
}

export default function LoginPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const utils = api.useUtils();
  const getNonce = api.auth.getNonce.useMutation();
  const verifySignature = api.auth.verifySignature.useMutation({
    onSuccess: async () => {
      await utils.user.me.invalidate();
    },
  });

  const handleConnect = async () => {
    if (!window.ethereum) {
      setStatus("No Ethereum provider found. Install MetaMask.");
      return;
    }
    try {
      setStatus("Requesting wallet...");
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      if (!accounts || accounts.length === 0) {
        setStatus("No account returned from wallet.");
        return;
      }
      const addr = accounts[0];
      setAddress(addr);
      setStatus(`Connected as ${addr}`);
    } catch (err: any) {
      setStatus(err?.message ?? "Failed to connect wallet.");
    }
  };

  const handleSignIn = async () => {
    if (!address) {
      setStatus("Connect your wallet first.");
      return;
    }
    if (!window.ethereum) {
      setStatus("No Ethereum provider found.");
      return;
    }

    try {
      setStatus("Requesting nonce from server...");
      const { message } = await getNonce.mutateAsync({ address });

      setStatus("Please sign the message in your wallet...");
      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      })) as string;

      setStatus("Verifying signature with server...");
      await verifySignature.mutateAsync({ address, message, signature });

      setStatus("Signed in! You can open the dashboard.");
    } catch (err: any) {
      console.error(err);
      setStatus(err?.message ?? "Authentication failed.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-50">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 p-8 shadow-xl shadow-slate-950/60 backdrop-blur">
        <h1 className="text-xl font-semibold tracking-tight">
          Login with Ethereum
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Connect your walle and sign a short message.
        </p>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleConnect}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={getNonce.isPending || verifySignature.isPending}
          >
            {address ? "Reconnect Wallet" : "Connect Wallet"}
          </button>

          <button
            type="button"
            onClick={handleSignIn}
            className="w-full rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-slate-50 transition hover:border-emerald-400/70 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!address || getNonce.isPending || verifySignature.isPending}
          >
            Sign Message &amp; Login
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-slate-300">
          <p>
            Status:{" "}
            <span className="font-mono text-emerald-300">
              {status || "Idle"}
            </span>
          </p>

          {status.startsWith("Signed in") && (
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-md border border-emerald-400/70 px-3 py-1 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/10"
            >
              Go to dashboard
            </Link>
          )}
        </div>

        
      </div>
    </main>
  );
}


