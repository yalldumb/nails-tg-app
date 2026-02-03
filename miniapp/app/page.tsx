"use client";

import { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

const SERVICES = [
  { title: "Натуральные ногти", price: 3000 },
  { title: "Наращивание: короткие", price: 3500 },
  { title: "Наращивание: средние", price: 4000 },
  { title: "Наращивание: длинные", price: 4500 },
  { title: "Наращивание: длинные+", price: 5000 },
  { title: "Наращивание: экстра", price: 7000 },
  { title: "Наращивание: экстра+", price: 8000 },
  { title: "Когти", price: "+1000" },
] as const;

type Step = 1 | 2 | 3;

export default function Page() {
  const [step, setStep] = useState<Step>(1);
  const [service, setService] = useState("");
  const [name, setName] = useState("");
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const canGoStep2 = !!service;
  const canSubmit = name.trim().length > 0 && !loading;

  /* ---- Telegram user ---- */
  useEffect(() => {
    // @ts-ignore
    const tg = window?.Telegram?.WebApp;
    const u = tg?.initDataUnsafe?.user;
    if (u) {
      setName(u.first_name || "");
      setTelegramId(String(u.id));
    }
  }, []);

  const previews = useMemo(() => images.map((f) => URL.createObjectURL(f)), [images]);
  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, 9 - images.length);
    if (list.length === 0) return;
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

    try {
      setLoading(true);
      await fetch(`${API}/bookings`, { method: "POST", body: fd });
      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen relative text-white">
      {/* background */}
      <img src="/bg.jpg" className="absolute inset-0 w-full h-full object-cover z-0" />
      <div className="absolute inset-0 bg-black/55 z-0" />

      <div className="relative z-10 max-w-md mx-auto px-3 py-4">
        {/* header */}
        <div className="mb-3">
          <h1 className="text-2xl font-medium leading-tight">Запись</h1>
          <div className="mt-1 text-xs opacity-70">Выбери услугу и отправь фото/комментарий</div>
        </div>

        {/* steps */}
        <div className="flex gap-2 mb-3">
          <div
            className={[
              "px-3 py-1.5 rounded-full border text-xs",
              step === 1
                ? "bg-white text-black border-white/80"
                : "bg-white/5 border-white/10 opacity-70",
            ].join(" ")}
          >
            Шаг 1 · Услуга
          </div>
          <div
            className={[
              "px-3 py-1.5 rounded-full border text-xs",
              step === 2
                ? "bg-white text-black border-white/80"
                : "bg-white/5 border-white/10 opacity-70",
            ].join(" ")}
          >
            Шаг 2 · Фото
          </div>
          <div
            className={[
              "px-3 py-1.5 rounded-full border text-xs",
              step === 3
                ? "bg-white text-black border-white/80"
                : "bg-white/5 border-white/10 opacity-70",
            ].join(" ")}
          >
            Шаг 3 · Готово
          </div>
        </div>

        {/* glass panel */}
        <div className="rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md p-3">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-2">
              {SERVICES.map((s) => (
                <button
                  key={s.title}
                  onClick={() => {
                    setService(s.title);
                    setStep(2);
                  }}
                  className="w-full text-left rounded-xl border border-white/10 bg-white/5 active:scale-[0.99] transition p-3"
                >
                  <div className="text-xs opacity-80">{s.title}</div>
                  <div className="mt-1 text-lg font-semibold tracking-tight">
                    {typeof s.price === "number" ? `${s.price} ₽` : s.price}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="text-xs opacity-75">
                Услуга: <span className="opacity-95">{service}</span>
              </div>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Имя"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm outline-none"
              />

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Комментарий и желаемое время"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm outline-none resize-none"
                rows={3}
              />

              <div className="flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 border border-white/10 text-xs">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && addFiles(e.target.files)}
                    className="hidden"
                  />
                  Добавить фото ({images.length}/9)
                </label>
                <div className="text-[11px] opacity-60">jpg/png/heic</div>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((src, i) => (
                    <div key={src} className="relative">
                      <img src={src} className="h-20 w-full object-cover rounded-xl border border-white/10" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 border border-white/10 text-xs"
                        aria-label="Удалить фото"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 rounded-xl bg-white/8 border border-white/10 text-sm"
                >
                  Назад
                </button>

                <button
                  onClick={submit}
                  disabled={!canSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm disabled:opacity-50"
                >
                  {loading ? "Отправка…" : "Отправить"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="text-xl font-semibold">Готово</div>
              <div className="mt-2 text-xs opacity-70">Запись отправлена. Мастер свяжется с вами.</div>

              <button
                onClick={() => {
                  setStep(1);
                  setService("");
                  setComment("");
                  setImages([]);
                }}
                className="mt-5 w-full py-2.5 rounded-xl bg-white/8 border border-white/10 text-sm"
              >
                Новая запись
              </button>
            </div>
          )}
        </div>

        {/* bottom action for step 1 */}
        {step === 1 && (
          <div className="mt-3">
            <button
              disabled={!canGoStep2}
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-2xl bg-white text-black text-sm disabled:opacity-50"
            >
              Дальше
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
