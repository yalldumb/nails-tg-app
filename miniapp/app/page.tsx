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
  const [date, setDate] = useState("");
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
      <img src="/bg.jpg" className="absolute inset-0 w-full h-full object-cover z-0" />
      <div className="absolute inset-0 z-0 vignette" />
      <div className="absolute inset-0 z-0 gradientOverlay" />

      <div className="relative z-10 max-w-md mx-auto px-3 py-4 space-y-3">
        {/* pills */}
        <div className="pillsRow">
          <div className={`stepPill ${step === 1 ? "active" : ""}`}>Услуга</div>
          <div className={`stepPill ${step === 2 ? "active" : ""}`}>Детали</div>
          <div className={`stepPill ${step === 3 ? "active" : ""}`}>Готово</div>
        </div>

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

        {step === 2 && (
          <div className="space-y-2 animIn contentPad">
            {/* date */}
            <div className="dateRow">
              <span className="calendarIcon">📅</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="dateInput"
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

            {/* attachment */}
            <div className="attachRow">
              <label className="clipBtn pressable">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                  className="hiddenInput"
                />
                📎
              </label>
              <span className="attachCount">{images.length}/9</span>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((f, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(f)}
                      className="h-16 w-full object-cover rounded-xl"
                      alt=""
                    />
                    <button onClick={() => removeImage(i)} className="xBtn pressable">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="stickyBar">
              <button className="btnGhost pressable" onClick={() => setStep(1)}>
                Назад
              </button>
              <button
                className="btn pressable"
                onClick={submit}
                disabled={loading || !name || !service || !date}
              >
                {loading ? "Отправка…" : "Отправить"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-2 animIn py-3">
            <div className="doneTitle">Запись отправлена</div>
            <p className="doneSub">Мастер свяжется с вами</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .pillsRow { display:flex; gap:8px; justify-content:center; }

        .stepPill {
          padding:5px 12px;
          border-radius:999px;
          background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.14);
          font-size:11px;
          opacity:.6;
        }
        .stepPill.active { background:rgba(255,255,255,.9); color:#000; opacity:1; }

        .glassCard {
          padding:12px;
          border-radius:16px;
          background:rgba(0,0,0,.42);
          border:1px solid rgba(255,255,255,.14);
          text-align:left;
        }

        .serviceTitle { font-size:11px; opacity:.75; }
        .servicePrice { font-size:14px; font-weight:500; }

        .dateRow {
          display:flex;
          align-items:center;
          gap:8px;
          padding:9px 11px;
          border-radius:12px;
          background:rgba(0,0,0,.42);
          border:1px solid rgba(255,255,255,.14);
        }
        .calendarIcon { font-size:14px; opacity:.85; }
        .dateInput {
          background:none;
          border:none;
          color:white;
          font-size:12px;
          outline:none;
          flex:1;
        }

        .input {
          width:100%;
          padding:9px 11px;
          border-radius:12px;
          background:rgba(0,0,0,.42);
          border:1px solid rgba(255,255,255,.14);
          font-size:12px;
          color:white;
        }

        .attachRow {
          display:flex;
          align-items:center;
          gap:8px;
        }
        .clipBtn {
          width:32px;
          height:32px;
          border-radius:50%;
          background:rgba(255,255,255,.08);
          border:2px solid rgba(255,255,255,.5);
          color:white;
          font-size:16px;
          display:flex;
          align-items:center;
          justify-content:center;
        }
        .attachCount {
          font-size:11px;
          opacity:.7;
        }

        .hiddenInput { display:none; }

        .xBtn {
          position:absolute;
          top:6px;
          right:6px;
          width:22px;
          height:22px;
          border-radius:50%;
          background:rgba(0,0,0,.65);
          border:1px solid rgba(255,255,255,.18);
          color:white;
          font-size:11px;
        }

        .stickyBar {
          position:fixed;
          left:0; right:0; bottom:0;
          padding:10px 14px;
          display:flex;
          gap:10px;
          background:linear-gradient(to top, rgba(0,0,0,.75), rgba(0,0,0,0));
          backdrop-filter:blur(14px);
        }

        .contentPad { padding-bottom:88px; }

        .btn {
          flex:1;
          padding:11px;
          border-radius:16px;
          background:white;
          color:black;
          font-size:13px;
        }
        .btnGhost {
          flex:1;
          padding:11px;
          border-radius:16px;
          background:rgba(255,255,255,.08);
          color:white;
          font-size:13px;
        }

        .doneTitle { font-size:15px; font-weight:500; }
        .doneSub { font-size:12px; opacity:.7; }

        .animIn {
          animation:animIn 150ms ease-out both;
        }
        @keyframes animIn {
          from { opacity:0; transform:translateY(6px); }
          to { opacity:1; transform:none; }
        }

        .pressable {
          transition:transform 120ms ease, filter 120ms ease;
          -webkit-tap-highlight-color:transparent;
        }
        .pressable:active {
          transform:scale(.985);
          filter:brightness(1.05);
        }

        .vignette {
          background:radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,.35) 55%, rgba(0,0,0,.78) 100%);
        }
        .gradientOverlay {
          background:linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.12) 42%, rgba(0,0,0,.58) 100%);
        }
      `}</style>
    </main>
  );
}
