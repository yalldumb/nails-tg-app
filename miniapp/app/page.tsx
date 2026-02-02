"use client";

import { useEffect, useMemo, useState } from "react";

type Service = { id: number; title: string; price: number; duration_minutes: number };
type Booking = { id: number; serviceTitle: string; date: string; time: string; comment?: string };

const API = process.env.NEXT_PUBLIC_API_BASE;

function rub(n: number) {
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}

function todayIsoLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Page() {
  const [services, setServices] = useState<Service[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState(todayIsoLocal());
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [error, setError] = useState<string | null>(null);
  const [my, setMy] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const tgUser = useMemo(() => {
    // @ts-ignore
    return globalThis?.Telegram?.WebApp?.initDataUnsafe?.user || null;
  }, []);

  const clientTelegramId = tgUser?.id ? String(tgUser.id) : null;
  const clientName = tgUser?.first_name || "Гость";

  useEffect(() => {
    if (!API) {
      setError("NEXT_PUBLIC_API_BASE не задан (проверь miniapp/.env.local)");
      return;
    }

    fetch(`${API}/services`)
      .then((r) => r.json())
      .then((d) => setServices(d.services || []))
      .catch(() => setError("Не удалось загрузить услуги (backend запущен?)"));
  }, []);

  useEffect(() => {
    if (!API || !service || step < 2) return;
    setLoading(true);
    setError(null);

    fetch(`${API}/availability?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(service.id)}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots || []))
      .catch(() => setError("Не удалось загрузить слоты"))
      .finally(() => setLoading(false));
  }, [service, date, step]);

  async function createBooking() {
    if (!API || !service || !time) return;

    setLoading(true);
    setError(null);

    const r = await fetch(`${API}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName,
        clientTelegramId,
        serviceId: service.id,
        date,
        time,
        comment,
      }),
    });

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d?.error || "Ошибка при создании записи");
      setLoading(false);
      return;
    }

    setStep(4);
    setLoading(false);
  }

  async function loadMy() {
    if (!API || !clientTelegramId) {
      setError("Открой мини-апп из Telegram, чтобы увидеть твои записи");
      return;
    }

    setLoading(true);
    setError(null);

    const r = await fetch(`${API}/my-bookings?clientTelegramId=${encodeURIComponent(clientTelegramId)}`);
    const d = await r.json().catch(() => ({}));
    setMy(d.bookings || []);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-md p-4">
        <h1 className="text-2xl font-semibold mb-4">Запись</h1>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setService(s);
                  setStep(2);
                }}
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition"
              >
                <div className="font-medium">{s.title}</div>
                <div className="text-xs text-neutral-400">
                  {s.duration_minutes} мин · {rub(s.price)}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && service && (
          <div className="space-y-4">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10"
            />

            <div className="flex flex-wrap gap-2">
              {loading && <div className="text-sm text-neutral-400">загрузка…</div>}
              {!loading &&
                slots.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTime(t)}
                    className={`px-4 py-2 rounded-full border ${
                      time === t ? "bg-white text-black" : "bg-white/5 border-white/10"
                    }`}
                  >
                    {t}
                  </button>
                ))}
            </div>

            <button
              disabled={!time}
              onClick={() => setStep(3)}
              className="w-full py-3 rounded-2xl bg-white text-black disabled:opacity-40"
            >
              Дальше
            </button>
          </div>
        )}

        {step === 3 && service && time && (
          <div className="space-y-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий"
              className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10"
              rows={3}
            />

            <button
              onClick={createBooking}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-white text-black disabled:opacity-40"
            >
              {loading ? "Создаю…" : "Подтвердить"}
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">Готово ✨</div>

            <button
              onClick={loadMy}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-white text-black disabled:opacity-40"
            >
              {loading ? "Загрузка…" : "Мои записи"}
            </button>

            {my.map((b) => (
              <div key={b.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="font-medium">{b.serviceTitle}</div>
                <div className="text-xs text-neutral-400">
                  {b.date} · {b.time}
                </div>
                {b.comment ? <div className="mt-2 text-xs text-neutral-500">{b.comment}</div> : null}
              </div>
            ))}

            {!clientTelegramId && (
              <div className="text-xs text-neutral-500">
                В браузере Telegram ID не передаётся — «Мои записи» заработают при запуске из Telegram.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
