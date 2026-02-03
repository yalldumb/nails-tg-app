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

  const selectedService = useMemo(
    () => SERVICES.find((s) => s.title === service),
    [service]
  );

  // Telegram user
  useEffect(() => {
    // @ts-ignore
    const tg = window?.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      setName(u.first_name || "");
      setTelegramId(String(u.id));
    }
  }, []);

  function addFiles(list: FileList) {
    const next = Array.from(list).slice(0, 9 - images.length);
    setImages((prev) => [...prev, ...next]);
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (!service || !name) return;

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
    <main className="min-h-screen relative text-white">
      {/* background image */}
      <img
        src="/bg.jpg"
        className="absolute inset-0 w-full h-full object-cover z-0"
        alt=""
      />
      <div className="absolute inset-0 bg-black/55 z-0" />

      <div className="relative z-10 max-w-md mx-auto px-4 py-6">
        <h1 className="text-3xl font-semibold mb-1">Запись</h1>
        <p className="text-sm opacity-70 mb-4">
          Выбери услугу и отправь фото/комментарий
        </p>

        {/* steps */}
        <div className="flex gap-2 mb-4 text-sm">
          <div
            className={`px-4 py-2 rounded-full border border-white/15 ${
              step === 1 ? "bg-white/90 text-black" : "bg-white/5 opacity-70"
            }`}
          >
            Шаг 1 · Услуга
          </div>
          <div
            className={`px-4 py-2 rounded-full border border-white/15 ${
              step === 2 ? "bg-white/90 text-black" : "bg-white/5 opacity-70"
            }`}
          >
            Шаг 2 · Фото
          </div>
          <div
            className={`px-4 py-2 rounded-full border border-white/15 ${
              step === 3 ? "bg-white/90 text-black" : "bg-white/5 opacity-70"
            }`}
          >
            Шаг 3 · Готово
          </div>
        </div>

        {/* glass wrapper */}
        <div className="rounded-3xl border border-white/10 bg-black/35 backdrop-blur-md p-4">
          {/* STEP 1: CARDS */}
          {step === 1 && (
            <div className="space-y-3">
              {SERVICES.map((s) => (
                <button
                  key={s.title}
                  onClick={() => {
                    setService(s.title);
                    setStep(2);
                  }}
                  className="w-full text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.99] transition p-4"
                >
                  <div className="text-base font-medium">{s.title}</div>
                  <div className="mt-2 text-2xl font-semibold tracking-wide">
                    {typeof s.price === "number" ? `${s.price} ₽` : s.price}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-3">
              {selectedService && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm opacity-75">Выбрано</div>
                  <div className="text-base font-medium">{selectedService.title}</div>
                  <div className="mt-1 text-xl font-semibold">
                    {typeof selectedService.price === "number"
                      ? `${selectedService.price} ₽`
                      : selectedService.price}
                  </div>
                </div>
              )}

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Имя"
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none"
              />

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Комментарий и желаемое время"
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none"
                rows={3}
              />

              <label className="block">
                <div className="text-sm opacity-80 mb-2">
                  Добавить фото ({images.length}/9)
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                  className="w-full text-sm"
                />
              </label>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((f, i) => (
                    <div key={i} className="relative">
                      <img
                        src={URL.createObjectURL(f)}
                        className="h-24 w-full object-cover rounded-xl border border-white/10"
                        alt=""
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/70 border border-white/15 text-sm"
                        aria-label="remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-2xl bg-white/8 border border-white/10"
                >
                  Назад
                </button>

                <button
                  onClick={submit}
                  disabled={loading || !name || !service}
                  className="flex-1 py-3 rounded-2xl bg-white text-black disabled:opacity-40"
                >
                  {loading ? "Отправка…" : "Отправить"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="text-center py-10">
              <div className="text-2xl font-semibold">Готово</div>
              <div className="mt-2 text-sm opacity-70">
                Запись отправлена. Мастер свяжется с вами.
              </div>

              <button
                onClick={() => {
                  setStep(1);
                  setService("");
                  setComment("");
                  setImages([]);
                }}
                className="mt-6 w-full py-3 rounded-2xl bg-white/8 border border-white/10"
              >
                Новая запись
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
