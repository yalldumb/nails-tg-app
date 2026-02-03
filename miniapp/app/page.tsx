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

  return (
    <main className="min-h-screen relative text-white overflow-hidden">
      <img src="/bg.jpg" className="absolute inset-0 w-full h-full object-cover z-0" />
      <div className="absolute inset-0 z-0 vignette" />
      <div className="absolute inset-0 z-0 gradientOverlay" />

      <div className="relative z-10 max-w-md mx-auto px-3 py-4 space-y-3">
        {/* top bar */}
        <div className="topBar">
          {step !== 1 ? (
            <button className="backBtn" onClick={() => setStep(step - 1 as Step)}>
              Назад
            </button>
          ) : (
            <div />
          )}

          <div className="stepsCenter">
            <div className={`stepPill ${step === 1 ? "active" : ""}`}>Услуга</div>
            <div className={`stepPill ${step === 2 ? "active" : ""}`}>Детали</div>
            <div className={`stepPill ${step === 3 ? "active" : ""}`}>Готово</div>
          </div>

          <div style={{ width: 52 }} />
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-1 animIn">
            {SERVICES.map((s) => (
              <button
                key={s.title}
                onClick={() => {
                  setService(s.title);
                  setStep(2);
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
        {step === 2 && (
          <div className="space-y-2 animIn">
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

            <label className="uploadBtn pressable">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
                className="hiddenInput"
              />
              Добавить фото ({images.length}/9)
              <div className="hint">jpg / png / heic</div>
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
              <button className="btnGhost" onClick={() => setStep(1)} disabled={loading}>
                Назад
              </button>
              <button className="btn" onClick={submit} disabled={loading || !name}>
                {loading ? "Отправка…" : "Отправить"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="text-center space-y-2 animIn py-3">
            <div className="text-[14px] font-medium">Запись отправлена</div>
            <p className="text-[11px] opacity-70">Мастер свяжется с вами</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .vignette {
          background: radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,.35) 55%, rgba(0,0,0,.78) 100%);
        }
        .gradientOverlay {
          background: linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.12) 42%, rgba(0,0,0,.58) 100%);
        }

        .topBar {
          display: grid;
          grid-template-columns: 52px 1fr 52px;
          align-items: center;
        }
        .stepsCenter {
          display: flex;
          justify-content: center;
          gap: 6px;
        }

        .stepPill {
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.14);
          font-size: 11px;
          opacity: .6;
        }
        .stepPill.active {
          background: rgba(255,255,255,.9);
          color: #000;
          opacity: 1;
        }

        .backBtn {
          font-size: 11px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.14);
          color: white;
        }

        .glassCard {
          padding: 12px;
          border-radius: 16px;
          background: rgba(0,0,0,.42);
          border: 1px solid rgba(255,255,255,.14);
          text-align: left;
        }
        .serviceTitle { font-size: 11px; opacity: .75; }
        .servicePrice { font-size: 14px; font-weight: 500; }

        .input {
          padding: 9px 11px;
          border-radius: 12px;
          background: rgba(0,0,0,.42);
          border: 1px solid rgba(255,255,255,.14);
          font-size: 12px;
          color: white;
          width: 100%;
        }

        .uploadBtn {
          padding: 10px 11px;
          border-radius: 14px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.14);
          font-size: 12px;
        }
        .hiddenInput { display:none; }
        .hint { font-size: 11px; opacity: .7; }

        .stickyBar {
          position: fixed;
          left: 0; right: 0; bottom: 0;
          padding: 10px 14px;
          display: flex;
          gap: 10px;
          background: linear-gradient(to top, rgba(0,0,0,.75), rgba(0,0,0,0));
          backdrop-filter: blur(14px);
        }

        .btn { flex:1; padding:11px; border-radius:16px; background:white; color:black; }
        .btnGhost { flex:1; padding:11px; border-radius:16px; background: rgba(255,255,255,.08); color:white; }

        .pressable {
          transition: transform 120ms ease, filter 120ms ease;
        }
        .pressable:active {
          transform: scale(.985);
          filter: brightness(1.05);
        }

        .animIn {
          animation: animIn 150ms ease-out both;
        }
        @keyframes animIn {
          from { opacity:0; transform: translateY(6px); }
          to { opacity:1; transform:none; }
        }
      `}</style>
    </main>
  );
}
// vercel-ping 1770131926
