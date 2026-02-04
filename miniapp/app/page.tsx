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

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function prettyDate(ymd: string) {
  const [y, m, d] = ymd.split("-");
  return `${d}.${m}.${y}`;
}

export default function Page() {
  const [step, setStep] = useState<Step>(1);
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const today = useMemo(() => new Date(), []);
  const minDate = useMemo(() => toYmd(today), [today]);
  const maxDate = useMemo(() => toYmd(addDays(today, 60)), [today]);

  useEffect(() => {
    // @ts-ignore
    const tg = window?.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      setName(u.first_name || "");
      setTelegramId(String(u.id));
    }
  }, []);

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, 10 - images.length);
    setImages((prev) => [...prev, ...list]);
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (!API) return;

    const fd = new FormData();
    fd.append("serviceTitle", service);
    fd.append("date", date);
    fd.append("clientName", name);
    if (telegramId) fd.append("telegramId", telegramId);
    fd.append("comment", comment);
    images.forEach((f) => fd.append("images", f));

    setLoading(true);
    try {
      await fetch(`${API}/bookings`, { method: "POST", body: fd });
      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen relative text-white overflow-hidden">
      <img src="/bg.jpg" className="absolute inset-0 w-full h-full object-cover z-0" alt="" />
      <div className="absolute inset-0 z-0 vignette" />
      <div className="absolute inset-0 z-0 gradientOverlay" />

      <div className="relative z-10 max-w-md mx-auto px-3 py-4 space-y-3">

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-1">
            {SERVICES.map((s) => (
              <button
                key={s.title}
                className="glassCard"
                onClick={() => {
                  setService(s.title);
                  setDate((d) => d || minDate);
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

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-2 pb-24">
            {/* 📅 ДАТА */}
            <label className="dateRow">
              <span className="dateEmoji">📅</span>
              <input
                type="date"
                value={date}
                min={minDate}
                max={maxDate}
                onChange={(e) => setDate(e.target.value)}
                className="dateInput"
              />
              <div className="dateText">{date && prettyDate(date)}</div>
            </label>

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
              rows={2}
            />

            {/* 📎 СКРЕПКА */}
            <label className="attachBtn">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
                className="hidden"
              />
              📎
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((f, i) => (
                  <div key={i} className="relative">
                    <img src={URL.createObjectURL(f)} className="h-16 w-full object-cover rounded-xl" />
                    <button onClick={() => removeImage(i)} className="xBtn">✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="stickyBar">
              <button className="btnGhost" onClick={() => setStep(1)}>Назад</button>
              <button className="btn" onClick={submit} disabled={!name || !date || loading}>
                Отправить
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="text-center space-y-2 py-3">
            <div className="doneTitle">Запись отправлена</div>
            <p className="doneSub">Мастер свяжется с вами</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .dateRow {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(0,0,0,.42);
          border: 1px solid rgba(255,255,255,.14);
        }
        .dateEmoji {
          font-size: 16px;
        }
        .dateInput {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }
        .dateText {
          font-size: 13px;
          opacity: .9;
        }
      `}</style>
    </main>
  );
}
