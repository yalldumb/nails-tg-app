"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

const SERVICES = [
  { title: "Натуральные ногти", price: 3000 },
  { title: "Короткие", price: 3500 },
  { title: "Средние", price: 4000 },
  { title: "Длинные", price: 4500 },
  { title: "Длинные+", price: 5000 },
  { title: "Экстра", price: 7000 },
  { title: "Экстра+", price: 8000 },
  { title: "Когти", price: "+1000" },
];

type Step = 1 | 2 | 3;

export default function Page() {
  const [step, setStep] = useState<Step>(1);
  const [service, setService] = useState("");
  const [name, setName] = useState("");
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---- Telegram user ---- */
  useEffect(() => {
    // @ts-ignore
    const tg = window?.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      setName(u.first_name || "");
      setTelegramId(String(u.id));
    }
  }, []);

  async function addFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, 9 - images.length);
    setImages((prev) => [...prev, ...list]);
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    const fd = new FormData();
    fd.append("serviceTitle", service);
    fd.append("clientName", name);
    if (telegramId) fd.append("telegramId", telegramId);
    fd.append("comment", comment);
    images.forEach((f) => fd.append("images", f));

    setLoading(true);
    await fetch(`${API}/bookings`, { method: "POST", body: fd });
    setLoading(false);

    setStep(3);
  }

  return (
    <main className="min-h-screen relative text-white">
      <img src="/bg.jpg" className="absolute inset-0 w-full h-full object-cover -z-10" />
      <div className="absolute inset-0 bg-black/60 -z-10" />

      <div className="relative z-10 max-w-md mx-auto p-4 space-y-4">
        <h1 className="text-3xl font-semibold text-center">Запись</h1>

        {step === 1 && (
          <>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10"
            >
              <option value="">Выбери услугу</option>
              {SERVICES.map((s) => (
                <option key={s.title} value={s.title}>
                  {s.title} — {typeof s.price === "number" ? `${s.price} ₽` : s.price}
                </option>
              ))}
            </select>

            <button
              disabled={!service}
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-2xl bg-white text-black disabled:opacity-40"
            >
              Дальше
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя"
              className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10"
            />

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий и желаемое время"
              className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10"
              rows={4}
            />

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              className="w-full text-sm"
            />

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((f, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(f)}
                      className="h-24 w-full object-cover rounded-xl"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 h-6 w-6 bg-black/70 rounded-full text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading || !name}
              className="w-full py-3 rounded-2xl bg-white text-black disabled:opacity-40"
            >
              {loading ? "Отправка…" : "Отправить"}
            </button>
          </>
        )}

        {step === 3 && (
          <div className="text-center space-y-2">
            <div className="text-3xl">✨</div>
            <div className="text-lg font-medium">Запись отправлена</div>
            <p className="text-sm opacity-70">Мастер свяжется с вами</p>
          </div>
        )}
      </div>
    </main>
  );
}
