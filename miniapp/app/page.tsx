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
    <main className="min-h-screen relative text-white overflow-hidden">
      {/* фон */}
      <img
        src="/bg.jpg"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* luxury виньетка */}
      <div className="absolute inset-0 z-0 vignette" />

      {/* мягкий градиент */}
      <div className="absolute inset-0 z-0 gradientOverlay" />

      <div className="relative z-10 max-w-md mx-auto px-4 py-6 space-y-4">
        {/* шаги */}
        <div className="flex gap-2 text-xs">
          <div className={`stepPill ${step === 1 ? "active" : ""}`}>Услуга</div>
          <div className={`stepPill ${step === 2 ? "active" : ""}`}>Детали</div>
          <div className={`stepPill ${step === 3 ? "active" : ""}`}>Готово</div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-2 animIn">
            {SERVICES.map((s) => (
              <button
                key={s.title}
                onClick={() => {
                  setService(s.title);
                  setStep(2);
                }}
                className="glassCard"
              >
                <div className="serviceTitle">{s.title}</div>
                <div className="servicePrice">
                  {typeof s.price === "number" ? `${s.price} ₽` : s.price}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-3 animIn">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя"
              className="input"
            />

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий и желаемое время"
              className="input"
              rows={3}
            />

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              className="text-xs opacity-80"
            />

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((f, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(f)}
                      className="h-20 w-full object-cover rounded-xl"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 h-5 w-5 bg-black/70 rounded-full text-[10px]"
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
              className="btn"
            >
              {loading ? "Отправка…" : "Отправить"}
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="text-center space-y-2 animIn">
            <div className="text-lg font-medium">Запись отправлена</div>
            <p className="text-xs opacity-70">Мастер свяжется с вами</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .vignette {
          background:
            radial-gradient(ellipse at center,
              rgba(0,0,0,0) 0%,
              rgba(0,0,0,.35) 55%,
              rgba(0,0,0,.75) 100%);
        }

        .gradientOverlay {
          background: linear-gradient(
            180deg,
            rgba(0,0,0,.35) 0%,
            rgba(0,0,0,.15) 40%,
            rgba(0,0,0,.55) 100%
          );
        }

        .stepPill {
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.12);
          font-size: 11px;
          opacity: .6;
        }

        .stepPill.active {
          background: rgba(255,255,255,.85);
          color: #000;
          opacity: 1;
        }

        .glassCard {
          width: 100%;
          padding: 12px;
          border-radius: 18px;
          background: rgba(0,0,0,.45);
          border: 1px solid rgba(255,255,255,.14);
          text-align: left;
        }

        .serviceTitle {
          font-size: 12px;
          opacity: .75;
        }

        .servicePrice {
          font-size: 16px;
          font-weight: 500;
          margin-top: 2px;
        }

        .input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(0,0,0,.45);
          border: 1px solid rgba(255,255,255,.14);
          font-size: 13px;
          color: white;
        }

        .btn {
          width: 100%;
          padding: 12px;
          border-radius: 18px;
          background: white;
          color: black;
          font-size: 14px;
        }

        .animIn {
          animation: animIn 160ms ease-out both;
        }

        @keyframes animIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
