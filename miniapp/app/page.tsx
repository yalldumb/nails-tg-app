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

function formatRu(ymd: string) {
  // ymd: YYYY-MM-DD -> DD.MM.YYYY
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

export default function Page() {
  const [step, setStep] = useState<Step>(1);
  const [uiStep, setUiStep] = useState<Step>(1);
  const [isFading, setIsFading] = useState(false);

  const [service, setService] = useState("");
  const [date, setDate] = useState<string>(""); // YYYY-MM-DD
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

  // ✅ haptics (restore)
  function haptic(kind: "light" | "medium" = "light") {
    // @ts-ignore
    const tg = window?.Telegram?.WebApp;
    try {
      tg?.HapticFeedback?.impactOccurred?.(kind);
    } catch {}
  }

  function goTo(next: Step) {
    if (next === uiStep) return;
    setIsFading(true);
    setTimeout(() => {
      setUiStep(next);
      setStep(next);
      setIsFading(false);
    }, 140);
  }

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, 10 - images.length); // ✅ до 10
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
      haptic("medium");
      goTo(3);
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
        {/* pills */}
        <div className="pillsRow">
          <div className={`stepPill ${uiStep === 1 ? "active" : ""}`}>Услуга</div>
          <div className={`stepPill ${uiStep === 2 ? "active" : ""}`}>Детали</div>
          <div className={`stepPill ${uiStep === 3 ? "active" : ""}`}>Готово</div>
        </div>

        {/* CONTENT (fade transition) */}
        <div className={`stepWrap ${isFading ? "fadeOut" : "fadeIn"}`}>
          {/* STEP 1 */}
          {uiStep === 1 && (
            <div className="space-y-1">
              {SERVICES.map((s) => (
                <button
                  key={s.title}
                  onClick={() => {
                    haptic("light");
                    setService(s.title);
                    setDate((prev) => prev || minDate);
                    goTo(2);
                  }}
                  className="glassCard pressable"
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
          {uiStep === 2 && (
            <div className="space-y-2 contentPad">
              {/* ✅ дата по центру над именем, без эмодзи */}
              <div className="centerStack">
                <div className="datePill">{formatRu(date)}</div>
                <div className="namePill">{name || " "}</div>
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Комментарий и желаемое время"
                className="input"
                rows={2}
              />

              {/* ✅ скрепка-иконка (пока emoji оставляем, svg сделаем отдельным шагом как ты просил раньше) */}
              <label className="attachBtn pressable" title="Добавить фото">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                  className="hiddenInput"
                />
                📎
              </label>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((f, i) => (
                    <div key={i} className="relative">
                      <img src={URL.createObjectURL(f)} className="h-16 w-full object-cover rounded-xl" alt="" />
                      <button
                        onClick={() => {
                          haptic("light");
                          removeImage(i);
                        }}
                        className="xBtn pressable"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {uiStep === 3 && (
            <div className="text-center space-y-2 py-3">
              <div className="doneTitle">Запись отправлена</div>
              <p className="doneSub">Мастер свяжется с вами</p>

              <button
                className="btn pressable mt-2"
                onClick={() => {
                  haptic("light");
                  setService("");
                  setDate("");
                  setComment("");
                  setImages([]);
                  goTo(1);
                }}
              >
                Новая запись
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sticky bar */}
      <div className={`stickyBar ${uiStep === 2 ? "stickyShow" : "stickyHide"}`} aria-hidden={uiStep !== 2}>
        <div className="stickyInner" />
        <div className="stickyContent">
          <button
            className="btnGhost pressable"
            onClick={() => {
              haptic("light");
              goTo(1);
            }}
            disabled={loading}
          >
            Назад
          </button>
          <button
            className="btn pressable"
            onClick={submit}
            disabled={loading || !service || !date}
          >
            {loading ? "Отправка…" : "Отправить"}
          </button>
        </div>
      </div>

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

        /* ✅ (1) pills bigger + bold */
        .pillsRow {
          display: flex;
          gap: 10px;
        }

        .stepPill {
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 12px;
          font-weight: 700;
          opacity: 0.6;
        }

        .stepPill.active {
          background: rgba(255, 255, 255, 0.90);
          color: #000;
          opacity: 1;
        }

        .stepWrap {
          transition: opacity 140ms ease, transform 140ms ease;
          will-change: opacity, transform;
        }
        .fadeIn {
          opacity: 1;
          transform: translateY(0);
        }
        .fadeOut {
          opacity: 0;
          transform: translateY(6px);
        }

        .glassCard {
          width: 100%;
          padding: 12px 12px;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.42);
          border: 1px solid rgba(255, 255, 255, 0.14);
          text-align: left;
        }

        .serviceTitle {
          font-size: 11px;
          opacity: 0.75;
        }

        .servicePrice {
          font-size: 14px;
          font-weight: 500;
          margin-top: 1px;
        }

        .input {
          width: 100%;
          padding: 10px 11px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.42);
          border: 1px solid rgba(255, 255, 255, 0.14);
          font-size: 12px;
          color: white;
        }

        /* ✅ (2) date centered above name, no emoji */
        .centerStack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
          margin-bottom: 2px;
        }

        .datePill {
          padding: 10px 14px;
          border-radius: 16px;
          background: rgba(0,0,0,.45);
          border: 1px solid rgba(255,255,255,.14);
          font-size: 14px;
          font-weight: 700;
          width: min(320px, 100%);
          text-align: center;
        }

        .namePill {
          padding: 10px 14px;
          border-radius: 16px;
          background: rgba(0,0,0,.45);
          border: 1px solid rgba(255,255,255,.14);
          font-size: 14px;
          font-weight: 600;
          width: min(320px, 100%);
          text-align: center;
        }

        .attachBtn {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.14);
          font-size: 16px;
          user-select: none;
        }

        .hiddenInput {
          display: none;
        }

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

        .contentPad {
          padding-bottom: 92px;
        }

        .stickyBar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 12px 14px;
          z-index: 50;
          pointer-events: none;
          opacity: 0;
          transition: opacity 160ms ease;
        }
        .stickyShow {
          opacity: 1;
          pointer-events: auto;
        }
        .stickyHide {
          opacity: 0;
          pointer-events: none;
        }

        .stickyInner {
          position: absolute;
          inset: 0;
          border-top-left-radius: 18px;
          border-top-right-radius: 18px;
          background: rgba(0, 0, 0, 0.62);
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

        .btnGhost {
          flex: 1;
          padding: 14px;
          border-radius: 18px;
          background: rgba(255,255,255,.08);
          color: white;
          font-size: 14px;
          border: 1px solid rgba(255,255,255,.14);
        }

        .doneTitle {
          font-size: 15px;
          font-weight: 500;
        }
        .doneSub {
          font-size: 12px;
          opacity: 0.7;
        }

        .pressable {
          -webkit-tap-highlight-color: transparent;
        }
        .pressable:active {
          transform: scale(.98);
        }
      

        /* ✅ iOS fix: prevent automatic zoom on focus */
        html { -webkit-text-size-adjust: 100%; }
        input, textarea, select { font-size: 16px !important; }


        /* ✅ iOS: stop auto-zoom on focus (Telegram/iOS) */
        html { -webkit-text-size-adjust: 100%; }
        input, textarea, select { font-size: 16px !important; }

        /* ✅ чуть больше воздуха между полями (если где-то слипается) */
        .input { margin-bottom: 10px; }
        .input:last-of-type { margin-bottom: 0; }
`}</style>
    </main>
  );
}
