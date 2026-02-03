"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="min-h-screen flex items-center justify-center text-white bg-neutral-950">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Админка</h1>

        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ADMIN_TOKEN"
          className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10"
        />

        {error && <div className="text-red-400 text-sm">{error}</div>}
      </div>
    </main>
  );
}
