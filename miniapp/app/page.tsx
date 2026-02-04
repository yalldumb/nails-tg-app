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

export default function Page() {
  const [step, setStep] = useState<Step>(1);

  const [service, setService] = useState("");
  const [date, setDate] = useState<string>(""); // YYYY-MM-DD
  const [name, setName] = useState("");
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [pressing, setPressing] = useState(false);

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

  function haptic(type: "light" | "medium" = "light") {
    // @ts-ignore
    const tg = window?.Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred(type);
  }

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, 10 - images.length);
    setImages((prev) => [...prev, ...list]);
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (!API || loading) return;

    haptic("medium");
    setPressing(true);
    setLoading(true);

    const fd = new FormData();
    fd.append("serviceTitle", service);
    fd.append("date", date);
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
      <img src="/bg.jpg" className="absolute inset-0 w-full h-full object-cover z-0" alt="" />
      <div className="absolute inset-0 z-0 vignette" />
      <div className="absolute inset-0 z-0 gradientOverlay" />

      <div className="relative z-10 max-w-md mx-auto px-3 py-4 space-y-3">
        {/* pills */}
        <div className="pillsRow">
          <div className={`stepPill ${step === 1 ? "active" : ""}`}>Услуга</div>
          <div className={`stepPill ${step === 2 ? "active" : ""}`}>Детали</div>
          <div className={`stepPill ${step === 3 ? "active" : ""}`}>Готово</div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-1">
            {SERVICES.map((s) => (
              <button
                key={s.title}
                className="glassCard pressable"
                onClick={() => {
                  haptic();
                  setService(s.title);
                  setDate((prev) => prev || minDate);
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
          <div className="space-y-3 contentPad">
            {/* date: emoji слева (вне рамки), дата по центру */}
            <div className="dateRow">
              <div className="dateEmoji" aria-hidden>📅</div>
              <input
                type="date"
                value={date}
                min={minDate}
                max={maxDate}
                onChange={(e) => setDate(e.target.value)}
                className="dateInput pressable"
              />
            </div>

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

            {/* только скрепка, без текста и счетчиков */}
            <label className="attachBtn pressable" title="Добавить фото">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
                className="hiddenInput"
              />
              <span className="clip" aria-hidden>📎</span>
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((f, i) => (
                  <div key={i} className="relative">
                    <img src={URL.createObjectURL(f)} className="h-16 w-full object-cover rounded-xl" alt="" />
                    <button onClick={() => removeImage(i)} className="xBtn pressable" aria-label="Удалить фото">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="text-center space-y-2 py-3">
            <div className="doneTitle">Запись отправлена</div>
            <p className="doneSub">Мастер свяжется с вами</p>

            <button
              className="btn pressable mt-2"
              onClick={() => {
                setService("");
                setDate("");
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

      {/* sticky actions */}
      {step === 2 && (
        <div className="stickyBar">
          <div className="stickyInner" />
          <div className="stickyContent">
            <button
              className="btnGhost pressable"
              onClick={() => {
                haptic();
                setStep(1);
              }}
              disabled={loading}
            >
              Назад
            </button>

            <button
              className={`btn pressable ${pressing ? "btnPress" : ""}`}
              onClick={submit}
              disabled={loading || !name || !service || !date}
            >
              {loading ? "Отправка…" : "Отправить"}
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .vignette {
          background: radial-gradient(
            ellipse at center,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.35) 55%,
            rgba(0, 0, 0, 0.78) 100%
          );
        }
        .gradientOverlay {
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.35) 0%,
            rgba(0, 0, 0, 0.12) 42%,
            rgba(0, 0, 0, 0.58) 100%
          );
        }

        .pillsRow {
          display: flex;
          gap: 8px;
        }
        .stepPill {
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 10px;
          opacity: 0.6;
        }
        .stepPill.active {
          background: rgba(255, 255, 255, 0.88);
          color: #000;
          opacity: 1;
        }

        .glassCard {
          width: 100%;
          padding: 12px 12px;
          border-radius: 16px;
          background: rgba(0,0,0,.45);
          border: 1px solid rgba(255,255,255,.14);
          text-align: left;
        }
        .serviceTitle { font-size: 12px; opacity: .75; }
        .servicePrice { font-size: 14px; font-weight: 500; margin-top: 1px; }

        .input {
          width: 100%;
          padding: 10px;
          border-radius: 12px;
          background: rgba(0,0,0,.45);
          border: 1px solid rgba(255,255,255,.14);
          color: white;
          font-size: 13px;
        }

        /* date: emoji слева, дата по центру внутри инпута */
        .dateRow {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dateEmoji {
          width: 28px;
          display: grid;
          place-items: center;
          font-size: 16px;
          opacity: .95;
        }
        .dateInput {
          flex: 1;
          padding: 10px;
          border-radius: 12px;
          background: rgba(0,0,0,.45);
          border: 1px solid rgba(255,255,255,.14);
          color: white;
          font-size: 13px;
          text-align: center;
          min-width: 0;
        }
        .dateInput::-webkit-calendar-picker-indicator {
          display: none; /* убираем правый календарик */
        }

        .attachBtn {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.14);
          user-select: none;
        }
        .clip {
          font-size: 18px;
          filter: grayscale(1) contrast(1.15);
        }
        .hiddenInput { display: none; }

        .xBtn {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: white;
          font-size: 11px;
          line-height: 22px;
          text-align: center;
        }

        .contentPad { padding-bottom: 92px; }

        .stickyBar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 12px;
          z-index: 50;
        }
        .stickyInner {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,.62);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .stickyContent {
          position: relative;
          display: flex;
          gap: 10px;
        }

        .btn {
          flex: 1;
          padding: 14px;
          border-radius: 18px;
          background: white;
          color: black;
          font-size: 14px;
          transition: transform 160ms ease;
        }
        .btnPress { transform: scale(0.96); }

        .btnGhost {
          flex: 1;
          padding: 14px;
          border-radius: 18px;
          background: rgba(255,255,255,.08);
          color: white;
          font-size: 14px;
          border: 1px solid rgba(255,255,255,.14);
        }

        .doneTitle { font-size: 15px; font-weight: 500; }
        .doneSub { font-size: 12px; opacity: .7; }

        .pressable { -webkit-tap-highlight-color: transparent; }
        .pressable:active { transform: scale(.98); }
      `}</style>
    </main>
  );
}
