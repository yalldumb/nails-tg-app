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
    const list = Array.from(files).slice(0, 9 - images.length);
    setImages((prev) => [...prev, ...list]);
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (!API) return;

    const fd = new FormData();
    fd.append("serviceTitle", service);
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

  const stepLabel = useMemo(() => {
    if (step === 1) return "Услуга";
    if (step === 2) return "Детали";
    return "Готово";
  }, [step]);

  return (
    <main className="min-h-screen relative text-white">
      {/* background */}
      <img src="/bg.jpg" className="absolute inset-0 w-full h-full object-cover z-0" />
      <div className="absolute inset-0 bg-black/55 z-0" />
      <div className="absolute inset-0 vignette z-0" />

      <div className="relative z-10 max-w-md mx-auto px-4 pt-4 pb-24">
        {/* top pills */}
        <div className="flex gap-2 mb-3">
          <div className={`stepPill ${step === 1 ? "active" : ""}`}>Услуга</div>
          <div className={`stepPill ${step === 2 ? "active" : ""}`}>Детали</div>
          <div className={`stepPill ${step === 3 ? "active" : ""}`}>Готово</div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="serviceList animIn">
            {SERVICES.map((s) => (
              <button
                key={s.title}
                onClick={() => {
                  setService(s.title);
                  setStep(2);
                }}
                className="serviceCard"
              >
                <div className="serviceTitle">{s.title}</div>
                <div className="servicePrice">
                  {typeof s.price === "number" ? `${s.price} ₽` : s.price}
                </div>
                <div className="shine" />
              </button>
            ))}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="animIn space-y-3">
            <div className="sectionTitle">Детали записи</div>

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

            <label className="uploadBtn">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
                className="hiddenInput"
              />
              Добавить фото ({images.length}/9)
              <div className="hint">Формат: jpg/png/heic</div>
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((f, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(f)}
                      className="h-20 w-full object-cover rounded-xl"
                      alt=""
                    />
                    <button onClick={() => removeImage(i)} className="xBtn">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="stickyBar">
              <button className="btnGhost" onClick={() => setStep(1)} disabled={loading}>
                Назад
              </button>
              <button className="btn" onClick={submit} disabled={loading || !name || !service}>
                {loading ? "Отправка…" : "Отправить"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="animIn doneWrap">
            <div className="doneTitle">Готово</div>
            <div className="doneSub">Запись отправлена. Мастер свяжется с вами.</div>
            <button
              className="btn"
              onClick={() => {
                setService("");
                setComment("");
                setImages([]);
                setStep(1);
              }}
            >
              Новая запись
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        .vignette {
          background: radial-gradient(
              60% 45% at 30% 10%,
              rgba(255, 255, 255, 0.08),
              rgba(0, 0, 0, 0) 60%
            ),
            radial-gradient(
              90% 70% at 50% 50%,
              rgba(0, 0, 0, 0) 35%,
              rgba(0, 0, 0, 0.55) 100%
            );
          pointer-events: none;
        }

        .stepPill {
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 12px;
          opacity: 0.6;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .stepPill.active {
          background: rgba(255, 255, 255, 0.92);
          color: #000;
          opacity: 1;
        }

        /* ✅ CHANGE: less gap + slightly taller cards */
        .serviceList {
          display: flex;
          flex-direction: column;
          gap: 10px; /* было больше -> меньше расстояние */
        }
        .serviceCard {
          width: 100%;
          padding: 14px 16px; /* было компактнее -> чуть выше */
          border-radius: 22px;
          background: rgba(0, 0, 0, 0.42);
          border: 1px solid rgba(255, 255, 255, 0.14);
          text-align: left;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .serviceTitle {
          font-size: 13px;
          font-weight: 500;
          opacity: 0.9;
          letter-spacing: 0.01em;
        }
        .servicePrice {
          margin-top: 3px;
          font-size: 18px;
          font-weight: 560;
          letter-spacing: 0.02em;
          font-variant-numeric: tabular-nums;
        }
        .shine {
          position: absolute;
          inset: -40px -80px auto auto;
          width: 180px;
          height: 180px;
          background: radial-gradient(
            circle at 30% 30%,
            rgba(255, 255, 255, 0.18),
            rgba(255, 255, 255, 0) 60%
          );
          transform: rotate(15deg);
          pointer-events: none;
        }

        .sectionTitle {
          font-size: 13px;
          opacity: 0.8;
          letter-spacing: 0.02em;
        }

        .input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.42);
          border: 1px solid rgba(255, 255, 255, 0.14);
          font-size: 13px;
          color: white;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .uploadBtn {
          display: block;
          width: 100%;
          padding: 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .hiddenInput {
          display: none;
        }
        .hint {
          margin-top: 4px;
          font-size: 12px;
          opacity: 0.7;
        }

        .xBtn {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: white;
          font-size: 12px;
          line-height: 24px;
          text-align: center;
        }

        .stickyBar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 12px 16px;
          display: flex;
          gap: 10px;
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.75),
            rgba(0, 0, 0, 0)
          );
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .btn {
          flex: 1;
          padding: 11px;
          border-radius: 16px;
          background: white;
          color: black;
          font-size: 13px;
        }

        .btnGhost {
          flex: 1;
          padding: 11px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.08);
          color: white;
          font-size: 13px;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .doneWrap {
          padding-top: 22px;
          text-align: left;
          display: grid;
          gap: 12px;
        }
        .doneTitle {
          font-size: 20px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        .doneSub {
          font-size: 13px;
          opacity: 0.75;
          line-height: 1.35;
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
