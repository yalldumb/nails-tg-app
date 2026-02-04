"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [pressing, setPressing] = useState(false);

  useEffect(() => {
    // @ts-ignore
    const tg = window?.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      setName(u.first_name || "");
      setTelegramId(String(u.id));
    }
  }, []);

  function haptic(type: "light" | "medium" = "light") {
    // @ts-ignore
    const tg = window?.Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred(type);
  }

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, 10 - images.length);
    setImages((prev) => [...prev, ...list]);
  }

  async function submit() {
    if (!API || loading) return;

    haptic("medium");
    setPressing(true);
    setLoading(true);

    const fd = new FormData();
    fd.append("serviceTitle", service);
    fd.append("clientName", name);
    if (telegramId) fd.append("telegramId", telegramId);
    fd.append("comment", comment);
    images.forEach((f) => fd.append("images", f));

    try {
      await fetch(`${API}/bookings`, { method: "POST", body: fd });
      setStep(3);
    } finally {
      setLoading(false);
      setTimeout(() => setPressing(false), 160);
    }
  }

  return (
    <main className="min-h-screen relative text-white overflow-hidden">
      <img src="/bg.jpg" className="absolute inset-0 w-full h-full object-cover z-0" />
      <div className="absolute inset-0 bg-black/60 z-0" />

      <div className="relative z-10 max-w-md mx-auto px-3 py-4 space-y-3">
        {step === 1 && (
          <div className="space-y-2">
            {SERVICES.map((s) => (
              <button
                key={s.title}
                className="glassCard pressable"
                onClick={() => {
                  haptic();
                  setService(s.title);
                  setStep(2);
                }}
              >
                <div className="serviceTitle">{s.title}</div>
                <div className="servicePrice">
                  {typeof s.price === "number" ? `${s.price} ₽` : s.price}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input"
              rows={2}
            />

            <label className="attachBtn pressable">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
                className="hidden"
              />
              📎
            </label>

            <div className="stickyBar">
              <button
                className={`btn ${pressing ? "btnPress" : ""}`}
                onClick={submit}
                disabled={loading}
              >
                {loading ? "Отправка…" : "Отправить"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-2">
            <div className="text-lg">Запись отправлена</div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .glassCard {
          width: 100%;
          padding: 12px;
          border-radius: 16px;
          background: rgba(0,0,0,.45);
          border: 1px solid rgba(255,255,255,.14);
          text-align: left;
        }
        .serviceTitle { font-size: 12px; opacity: .75; }
        .servicePrice { font-size: 14px; font-weight: 500; }

        .input {
          width: 100%;
          padding: 10px;
          border-radius: 12px;
          background: rgba(0,0,0,.45);
          border: 1px solid rgba(255,255,255,.14);
          color: white;
          font-size: 13px;
        }

        .attachBtn {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.14);
          font-size: 16px;
        }

        .stickyBar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 12px;
          background: linear-gradient(to top, rgba(0,0,0,.7), transparent);
        }

        .btn {
          width: 100%;
          padding: 14px;
          border-radius: 18px;
          background: white;
          color: black;
          font-size: 14px;
          transition: transform 160ms ease;
        }

        .btnPress {
          transform: scale(0.96);
        }

        .pressable {
          -webkit-tap-highlight-color: transparent;
        }
        .pressable:active {
          transform: scale(.98);
        }
      `}</style>
    </main>
  );
}
