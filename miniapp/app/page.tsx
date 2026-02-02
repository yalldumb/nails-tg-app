"use client";

import { useEffect, useMemo, useState } from "react";

type Service = { id: number; title: string; price: number; duration_minutes: number };
type Booking = { id: number; serviceTitle: string; date: string; comment?: string; images?: string[] };

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
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
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

  async function fileToDataUrl(file: File): Promise<string> {
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    });

    // Compress via canvas to keep payload small
    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image load failed"));
    });

    const maxSide = 1280;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);

    // jpeg is smaller than png for photos
    return canvas.toDataURL("image/jpeg", 0.82);
  }

  async function onPickImages(files: FileList | null) {
    if (!files) return;
    const picked = Array.from(files).slice(0, 3 - images.length);
    if (picked.length <= 0) return;

    setLoading(true);
    setError(null);

    try {
      const converted: string[] = [];
      for (const f of picked) {
        converted.push(await fileToDataUrl(f));
      }
      setImages((prev) => [...prev, ...converted].slice(0, 3));
    } catch {
      setError("Не удалось обработать фото");
    } finally {
      setLoading(false);
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function createBooking() {
    if (!API || !service) return;

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
        comment,
        images,
      }),
    });

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d?.error || "Ошибка при создании записи");
      setLoading(false);
      return;
    }

    setStep(3);
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
    <main
      className="min-h-screen text-white relative"
      style={{
        backgroundImage: "url('/bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Dark overlay for readability */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/70 to-black/90"
      />

      <div className="relative z-10 mx-auto max-w-md p-4">
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

            <div className="space-y-2">
              <div className="text-sm text-neutral-300">Референсы (до 3 фото)</div>

              <label className="block w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm cursor-pointer hover:bg-white/10 transition">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    onPickImages(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />
                ➕ Прикрепить фото
              </label>

              {images.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {images.map((src, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={src}
                        alt={`ref-${idx + 1}`}
                        className="h-16 w-16 object-cover rounded-xl border border-white/10"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black/70 border border-white/10 text-xs"
                        aria-label="remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-neutral-500">Фото сжимаются автоматически перед отправкой.</div>
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий (укажи время и детали)"
              className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10"
              rows={4}
            />

            <button
              onClick={createBooking}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-white text-black disabled:opacity-40"
            >
              {loading ? "Отправляю…" : "Отправить"}
            </button>
          </div>
        )}

        {step === 3 && (
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
                  {b.date}
                </div>
                {b.comment ? <div className="mt-2 text-xs text-neutral-500">{b.comment}</div> : null}
                {b.images && b.images.length > 0 ? (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {b.images.map((src, i) => (
                      <a key={i} href={src} target="_blank" rel="noreferrer">
                        <img
                          src={src}
                          alt={`img-${i + 1}`}
                          className="h-16 w-16 object-cover rounded-xl border border-white/10"
                        />
                      </a>
                    ))}
                  </div>
                ) : null}
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
