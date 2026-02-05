"use client";

import { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

const SERVICE_MAIN: { title: string; price: number | null; value: "natural" | "extension" }[] = [
  { title: "Натуральные ногти", price: 3000, value: "natural" },
  { title: "Наращивание / Коррекция", price: null, value: "extension" },
];

const SERVICE_LENGTHS: { title: string; price: number }[] = [
  { title: "Короткие", price: 3500 },
  { title: "Средние", price: 4000 },
  { title: "Длинные", price: 4500 },
  { title: "Длинные+", price: 5000 },
  { title: "Экстра", price: 7000 },
  { title: "Экстра+", price: 8000 },
];

type Step = 1 | 2 | 3;
type ServiceGroup = "main" | "lengths";

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

function formatYmdToRu(ymd: string) {
  // ymd = YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  const [, y, mm, dd] = m;
  return `${dd}.${mm}.${y}`;
}

function PaperclipIcon() {
  // ч/б, “толще”
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 17.5l8.1-8.1a3 3 0 10-4.2-4.2L5.8 12.3a5 5 0 107.1 7.1l8.5-8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Page() {
  const [step, setStep] = useState<Step>(1);
  const [uiStep, setUiStep] = useState<Step>(1);
  const [isFading, setIsFading] = useState(false);

  const [serviceGroup, setServiceGroup] = useState<ServiceGroup>("main");
  const [serviceTitle, setServiceTitle] = useState("");
  const [servicePrice, setServicePrice] = useState<number | null>(null);

  const [claws, setClaws] = useState(false);

  const [date, setDate] = useState<string>(""); // YYYY-MM-DD
  const [name, setName] = useState("");
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  function hapticLight() {
    try {
      // @ts-ignore
      const tg = window?.Telegram?.WebApp;
      tg?.HapticFeedback?.impactOccurred?.("light");
    } catch {}
  }

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

  // чтобы не “залипали” под-экраны услуг
  useEffect(() => {
    if (uiStep === 1) setServiceGroup("main");
  }, [uiStep]);

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
    const list = Array.from(files).slice(0, 10 - images.length); // до 10
    setImages((prev) => [...prev, ...list]);
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  const canUseClaws = useMemo(() => {
    // “Когти” только для наращивания/коррекции (lengths)
    return serviceTitle !== "" && servicePrice !== null && serviceTitle !== "Натуральные ногти";
  }, [serviceTitle, servicePrice]);

  const shownPrice = useMemo(() => {
    if (servicePrice == null) return null;
    return servicePrice + (canUseClaws && claws ? 1000 : 0);
  }, [servicePrice, claws, canUseClaws]);

  async function submit() {
    if (!API) return;

    const fd = new FormData();
    fd.append("serviceTitle", serviceTitle);
    if (shownPrice != null) fd.append("servicePrice", String(shownPrice));
    fd.append("date", date);

    fd.append("clientName", name);
    if (telegramId) fd.append("telegramId", telegramId);

    // чтобы ничего не ломать в бэке: claws кладём отдельным флагом + дублируем в коммент (на всякий)
    fd.append("claws", claws && canUseClaws ? "1" : "0");

    const finalComment =
      (comment || "").trim() +
      (claws && canUseClaws ? (comment.trim() ? "\n" : "") + "Когти: да" : "");
    fd.append("comment", finalComment);

    images.forEach((f) => fd.append("images", f));

    setLoading(true);
    try {
      await fetch(`${API}/bookings`, { method: "POST", body: fd });
      goTo(3);
    } finally {
      setLoading(false);
    }
  }

  const navTitle = uiStep === 1 ? "Услуга" : uiStep === 2 ? "Детали" : "Готово";

  return (
    <main className="min-h-screen relative text-white overflow-hidden">
      <img src="/bg.jpg" className="absolute inset-0 w-full h-full object-cover z-0" alt="" />
      <div className="absolute inset-0 z-0 vignette" />
      <div className="absolute inset-0 z-0 gradientOverlay" />

      <div className="relative z-10 max-w-md mx-auto px-3 py-4 space-y-3">
        {/* iOS-like top bar */}
        <div className="topBar">
          <button
            className={`topIcon ${uiStep !== 1 ? "show" : "hide"}`}
            onClick={() => {
              hapticLight();
              goTo(1);
            }}
            disabled={loading}
            aria-label="Назад"
            type="button"
          >
            ‹
          </button>

          <div className="navTitle">{navTitle}</div>

          <button
            className={`topAction ${uiStep === 2 ? "show" : "hide"}`}
            onClick={() => {
              hapticLight();
              submit();
            }}
            disabled={loading || !name || !serviceTitle || !date}
            type="button"
          >
            Отправить
          </button>
        </div>

        {/* CONTENT (fade transition) */}
        <div className={`stepWrap ${isFading ? "fadeOut" : "fadeIn"}`}>
          {/* STEP 1 */}
          {uiStep === 1 && (
            <div className="space-y-2">
              {serviceGroup === "main" && (
                <div className="space-y-2">
                  {SERVICE_MAIN.map((s) => (
                    <button
                      key={s.value}
                      className="glassCard pressable"
                      onClick={() => {
                        hapticLight();

                        if (!date) setDate(minDate);

                        if (s.value === "natural") {
                          setServiceTitle(s.title);
                          setServicePrice(s.price);
                          setClaws(false);
                          goTo(2);
                        } else {
                          setServiceGroup("lengths");
                        }
                      }}
                      type="button"
                    >
                      <div className="serviceTitle">{s.title}</div>

                      {s.price != null ? (
                        <div className="servicePrice">{s.price} ₽</div>
                      ) : (
                        <div className="serviceSub">Выбрать длину</div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {serviceGroup === "lengths" && (
                <div className="space-y-2">
                  <div className="subHeadRow">
                    <button
                      className="subBack pressable"
                      onClick={() => {
                        hapticLight();
                        setServiceGroup("main");
                      }}
                      type="button"
                      aria-label="Назад к услугам"
                    >
                      ‹
                    </button>
                    <div className="subHead">Наращивание / Коррекция</div>
                  <div
                    className="glassCard pressable"
                    style={{
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      paddingTop: 10,
                      paddingBottom: 10,
                    }}
                    onClick={() => setClaws((v) => !v)}
                    role="button"
                    aria-pressed={claws}
                    data-testid="claws-toggle"
                  >
                    <div>
                      <div className="serviceTitle" style={{ opacity: 0.9 }}>Когти</div>
                      <div className="serviceTitle" style={{ marginTop: 2, opacity: 0.65 }}>+1000 ₽</div>
                    </div>
                    <div
                      style={{
                        width: 46,
                        height: 26,
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: claws ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)",
                        padding: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          background: "rgba(255,255,255,0.92)",
                          transform: claws ? "translateX(18px)" : "translateX(0px)",
                          transition: "transform 160ms ease",
                        }}
                      />
                    </div>
                  </div>

                    <div className="subSpacer" />
                  </div>

                  <div className="space-y-1">
                    {SERVICE_LENGTHS.map((l) => {
                      const price = l.price;
                      const priceShown = price + (claws ? 1000 : 0);

                      return (
                        <button
                          key={l.title}
                          className="glassCard pressable"
                          onClick={() => {
                            hapticLight();
                            if (!date) setDate(minDate);

                            setServiceTitle(l.title);
                            setServicePrice(price);
                            goTo(2);
                          }}
                          type="button"
                        >
                          <div className="serviceTitle">{l.title}</div>
                          <div className="servicePrice">{priceShown} ₽</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {uiStep === 2 && (
            <div className="space-y-2 contentPad">
              {/* дата по центру, без эмодзи */}
              <div className="centerRow">
                <div className="datePill pressable">
                  <input
                    type="date"
                    value={date}
                    min={minDate}
                    max={maxDate}
                    onChange={(e) => setDate(e.target.value)}
                    className="dateInput"
                    aria-label="Дата записи"
                  />
                  <div className="dateText" aria-hidden="true">
                    {formatYmdToRu(date || minDate)}
                  </div>
                </div>
              </div>

              {/* имя по центру (только табличка, не вся строка) */}
              <div className="centerRow">
                <div className="namePill" aria-label="Имя">
                  {name || " "}
                </div>
              </div>

              {/* “Когти” — тумблер в Деталях (только для длины) */}
              {canUseClaws && (
                <button
                  className="clawsRow pressable"
                  onClick={() => {
                    hapticLight();
                    setClaws((v) => !v);
                  }}
                  type="button"
                  aria-pressed={claws}
                >
                  <div className="clawsLeft">
                    <div className="clawsTitle">Когти</div>
                    <div className="clawsSub">+1000 ₽</div>
                  </div>
                  <div className={`toggleBtn ${claws ? "on" : ""}`}>
                    <div className="toggleKnob" />
                  </div>
                </button>
              )}

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Комментарий и желаемое время"
                className="input"
                rows={2}
              />

              {/* скрепка без текста */}
              <div className="attachRow">
                <label className="attachBtn pressable" title="Добавить фото">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && addFiles(e.target.files)}
                    className="hiddenInput"
                  />
                  <span className="clip">
                    <PaperclipIcon />
                  </span>
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((f, i) => (
                    <div key={i} className="relative">
                      <img src={URL.createObjectURL(f)} className="h-16 w-full object-cover rounded-xl" alt="" />
                      <button
                        onClick={() => {
                          hapticLight();
                          removeImage(i);
                        }}
                        className="xBtn pressable"
                        type="button"
                        aria-label="Удалить фото"
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

        .topBar {
          display: grid;
          grid-template-columns: 52px 1fr 92px;
          align-items: center;
          height: 44px;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 0 8px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .navTitle {
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.2px;
          opacity: 0.95;
        }

        .topIcon {
          height: 34px;
          width: 44px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 22px;
          color: #fff;
          line-height: 1;
        }

        .topAction {
          height: 34px;
          padding: 0 12px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #000;
          font-size: 12px;
          font-weight: 700;
          justify-self: end;
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
          opacity: 0.78;
        }

        .servicePrice {
          transition: transform 160ms ease, opacity 160ms ease;

          font-size: 15px;
          font-weight: 600;
          margin-top: 2px;
          letter-spacing: 0.2px;
        }

        .serviceSub {
          margin-top: 6px;
          font-size: 11px;
          opacity: 0.62;
        }

        .subHeadRow {
          display: grid;
          grid-template-columns: 34px 1fr 34px;
          align-items: center;
          gap: 10px;
          margin-top: 2px;
          margin-bottom: 2px;
        }
        .subBack {
          height: 30px;
          width: 34px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 18px;
          line-height: 1;
          color: #fff;
        }
        .subHead {
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          opacity: 0.9;
        }
        .subSpacer {
          height: 1px;
        }

        .centerRow {
          display: flex;
          justify-content: center;
        }

        .datePill {
          position: relative;
          width: 220px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.42);
          border: 1px solid rgba(255, 255, 255, 0.14);
          height: 38px;
          display: grid;
          place-items: center;
        }

        .dateInput {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
        }

        .dateText {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.2px;
        }

        .namePill {
          width: 220px;
          height: 38px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.42);
          border: 1px solid rgba(255, 255, 255, 0.14);
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.2px;
        }

        .clawsRow {
          width: 100%;
          padding: 10px 12px;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.42);
          border: 1px solid rgba(255, 255, 255, 0.14);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          text-align: left;
        }
        .clawsTitle {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.2px;
        }
        .clawsSub {
          margin-top: 2px;
          font-size: 11px;
          opacity: 0.7;
        }

        .toggleBtn {
          width: 44px;
          height: 24px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.16);
          position: relative;
          flex: 0 0 auto;
        }
        .toggleKnob {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.92);
          position: absolute;
          top: 1px;
          left: 1px;
          transform: translateX(0);
          transition: transform 160ms ease, background 160ms ease;
        }
        .toggleBtn.on {
          background: rgba(255, 255, 255, 0.18);
        }
        .toggleBtn.on .toggleKnob {
          transform: translateX(20px);
          background: #000;
        }

        .input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.42);
          border: 1px solid rgba(255, 255, 255, 0.14);
          font-size: 12px;
          color: white;
        }

        .attachRow {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
        }

        .attachBtn {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.92);
          cursor: pointer;
          user-select: none;
        }

        .clip {
          display: grid;
          place-items: center;
          transform: translateY(0.5px);
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
          padding-bottom: 14px;
        }

        .doneTitle {
          font-size: 15px;
          font-weight: 600;
        }
        .doneSub {
          font-size: 12px;
          opacity: 0.7;
        }

        .pressable {
          transition: transform 120ms ease, filter 120ms ease;
          -webkit-tap-highlight-color: transparent;
        }
        .pressable:active {
          transform: scale(0.985);
          filter: brightness(1.05);
        }
      `}</style>
    </main>
  );
}