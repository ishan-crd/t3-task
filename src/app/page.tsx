import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-50">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-xl shadow-slate-950/60 backdrop-blur">
        <h1 className="text-2xl font-semibold tracking-tight">
          Web3 Cookie Auth Demo
          </h1>
        <p className="mt-2 text-sm text-slate-300">
          Ethereum wallet login with{" "}
          <span className="font-semibold">signed messages</span>, secure{" "}
          <span className="font-semibold">HTTP-only cookies</span>, and{" "}
          <span className="font-semibold">tRPC-protected APIs</span>.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
          >
            Go to Login
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-50/90 transition hover:border-emerald-400/70 hover:text-emerald-200"
          >
            Go to Dashboard (protected)
          </Link>
        </div>

        <div className="mt-8 rounded-xl border border-white/5 bg-slate-900/70 p-4 text-xs text-slate-300">
          <p className="font-semibold text-slate-100">
            How this app is structured
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>tRPC public routes for nonce + signature verification</li>
            <li>HTTP-only cookie sessions with Prisma-backed storage</li>
            <li>tRPC middleware enforcing auth for protected routes</li>
          </ul>
        </div>
        </div>
      </main>
  );
}

