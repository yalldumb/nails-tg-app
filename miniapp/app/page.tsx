"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: number;
  clientName: string;
  serviceTitle: string;
  date: string;
  comment?: string;
  images?: string[];
};

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!API) return;

    setLoading(true);
    setError(null);

    try {
      const r = await fetch(`${API}/admin/bookings`, {
        headers: {
          "x-admin-token": token,
        },
      });

      const d = await r.json();
      if (!r.ok) {
        setError(d?.error || "Ошибка");
        setBookings([]);
      } else {
        setBookings(d.bookings || []);
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-md p-4 space-y-4">
        <h1 className="text-2xl font-semibold">Админка</h1>

        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ADMIN_TOKEN"
          className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10"
        />

        <button
          onClick={load}
          disabled={!token || loading}
          className="w-full py-3 rounded-2xl bg-white text-black disabled:opacity-40"
        >
          {loading ? "Загрузка…" : "Загрузить записи"}
        </button>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm">
            {error}
          </div>
        )}

        {bookings.map((b) => (
          <div key={b.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="font-medium">{b.serviceTitle}</div>
            <div className="text-xs text-neutral-400">{b.date}</div>
            <div className="mt-2 text-sm">{b.clientName}</div>
            {b.comment && (
              <div className="mt-2 text-xs text-neutral-300">{b.comment}</div>
            )}

            {b.images && b.images.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {b.images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    className="h-16 w-16 object-cover rounded-xl border border-white/10"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
