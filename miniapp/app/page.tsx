"use client";

import { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

const SERVICE_MAIN: { title: string; price: number | null; value: string }[] = [
  { title: "Натуральные ногти", price: 3000, value: "Натуральные ногти" },
  { title: "Наращивание / Коррекция", price: null, value: "__LENGTHS__" },
];

const SERVICE_LENGTHS: { title: string; price: number | string }[] = [
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

  function hapticLight() {
    try {
      // @ts-ignore
      const tg = window?.Telegram?.WebApp;
      tg?.HapticFeedback?.impactOccurred?.("light");
    } catch {}
  }

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
  const [serviceGroup, setServiceGroup] = useState<"main" | "lengths">("main");

  const today = useMemo(() => new Date(), []);
  const minDate = useMemo(() => toYmd(today), [today]);
  const maxDate = useMemo(() => toYmd(addDays(today, 60)), [today]);

  useEffect(() => {
    // @ts-ignore
    const tg = window?.Telegram?.WebApp;
    try { tg.expand?.(); tg.ready?.(); } catch (e) {}

    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      setName(u.first_name || "");
      setTelegramId(String(u.id));
    }
  }, []);

  // ✅ iOS focus: prevent scroll jump (body lock)
  useEffect(() => {
    let locked = false;
    let scrollY = 0;

    function lock() {
      if (locked) return;
      locked = true;
      scrollY = window.scrollY || 0;

      const b = document.body;
      b.style.position = "fixed";
      b.style.top = `-${scrollY}px`;
      b.style.left = "0";
      b.style.right = "0";
      b.style.width = "100%";
      b.style.overflow = "hidden";
    }

    function unlock() {
      if (!locked) return;
      locked = false;

      const b = document.body;
      b.style.position = "";
      b.style.top = "";
      b.style.left = "";
      b.style.right = "";
      b.style.width = "";
      b.style.overflow = "";

      window.scrollTo(0, scrollY);
    }

    // фокус/блюр на любом инпуте/текстарии
    function onFocusIn(e: any) {
      const t = e?.target;
      if (!t) return;
      const tag = String(t.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") lock();
    }
    function onFocusOut() {
      // небольшой таймаут чтобы iOS успел закончить анимацию клавиатуры
      setTimeout(unlock, 60);
    }

    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);

    return () => {
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focusout", onFocusOut, true);
      unlock();
    };
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
      <img src="/bg.jpg" className="fixed inset-0 w-full h-full object-cover z-0 bgFixed" alt="" />
      <div className="absolute inset-0 z-0 vignette" />
      <div className="absolute inset-0 z-0 gradientOverlay" />

      <div className="relative z-10 max-w-md mx-auto px-3 py-4 space-y-3">
        {/* pills */}
        <div className="topBar">
          <button
            className={`topIcon ${uiStep !== 1 || (uiStep === 1 && serviceGroup === "lengths") ? "show" : "hide"}`}
            onClick={() => { hapticLight(); if (uiStep === 1 && serviceGroup === "lengths") { setServiceGroup("main"); } else { goTo(1); } }}
            disabled={loading}
            aria-label="Назад"
            type="button"
          >
            ‹
          </button>

          <div className="navTitle">
            {uiStep === 1 ? "Услуга" : uiStep === 2 ? "Детали" : "Готово"}
          </div>

          <button
            className={`topAction ${uiStep === 2 ? "show" : "hide"}`}
            onClick={() => { hapticLight(); submit(); }}
            disabled={loading || !name || !service || !date}
            type="button"
          >
            Отправить
          </button>
        </div>

        {/* CONTENT (fade transition) */}
        <div className={`stepWrap ${isFading ? "fadeOut" : "fadeIn"}`}>
          {/* STEP 1 */}
          {uiStep === 1 && (
          <div className="space-y-1">
            {serviceGroup === "main" && (
              <div className="space-y-1">
                {SERVICE_MAIN.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => {
                      if (s.value === "__LENGTHS__") {
                        setServiceGroup("lengths");
                        return;
                      }
                      setService(s.value);
                      setDate((prev) => prev || minDate);
                      goTo(2);
                    }}
                    className="glassCard pressable"
                  >
                    <div className="serviceTitle">{s.title}</div>
                    {s.price !== null ? (
                      <div className="servicePrice">{typeof s.price === "number" ? `${s.price} ₽` : s.price}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            )}

            {serviceGroup === "lengths" && (
              <div className="space-y-1">
                {SERVICE_LENGTHS.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => {
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
          </div>
        )}

        {/* STEP 2 */}
          {uiStep === 2 && (
            <div className="fieldStack contentPad">
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
                  setServiceGroup("main");
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


        /* bgFixed: prevent iOS TG keyboard jump */
        .bgFixed {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw;
          height: 100svh;
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform;
          pointer-events: none;
        }
        @supports (height: 100dvh) {
          .bgFixed { height: 100dvh; }
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


        /* ✅ bg fixed (stop iOS keyboard zoom illusion) */
        .bgFixed{
          transform: translateZ(0);
          will-change: transform;
        }


        /* ✅ fieldStack gap */
        .fieldStack{
          display:flex;
          flex-direction:column;
          gap:12px;
        }


        /* ✅ dynamic viewport (reduce iOS keyboard jump) */
        :root{ --app-vh: 100svh; }
        @supports (height: 100dvh){
          :root{ --app-vh: 100dvh; }
        }

        /* Tailwind min-h-screen => 100vh. Перекрываем на svh/dvh */
        .min-h-screen{ min-height: var(--app-vh) !important; }

        /* фон всегда по высоте app viewport */
        .bgFixed{
          top:0;
          left:0;
          height: var(--app-vh) !important;
        }

        /* меньше дерганий/боуна при появлении клавы */
        html, body { overscroll-behavior: none; }
          .topBar {
          display: grid;
          grid-template-columns: 44px 1fr auto;
          align-items: center;
          gap: 10px;
          height: 44px;
        }

        .navTitle {
          text-align: center;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.2px;
          opacity: 0.95;
          user-select: none;
        }

        .pillsCenter {
          flex: 1;
          justify-content: center;
        }
          .topIcon {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.92);
          font-size: 28px;
          font-weight: 800;
          line-height: 1;
          display: grid;
          place-items: center;
          padding-bottom: 2px;
          -webkit-tap-highlight-color: transparent;
        }
          .topAction {
          height: 36px;
          padding: 0 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #000;
          font-size: 13px;
          font-weight: 800;
          -webkit-tap-highlight-color: transparent;
        }

        .topIcon.hide,
        .topAction.hide {
          opacity: 0;
          pointer-events: none;
        }
        .topIcon.show,
        .topAction.show {
          opacity: 1;
          pointer-events: auto;
        }

`}</style>
    </main>
  );
}
