"use client";

import { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

const SERVICES: { title: string; price: number | string }[] = [
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
    const u = tg?.initDataUnsafe?.user;
    if (u) {
      setName(u.first_name || "");
      setTelegramId(String(u.id));
    }
  }, []);

  const selectedLabel = useMemo(() => {
    const s = SERVICES.find((x) => x.title === service);
    if (!s) return "";
    return `${s.title} — ${typeof s.price === "number" ? `${s.price} ₽` : s.price}`;
  }, [service]);

  function addFiles(list: FileList | File[]) {
    const arr = Array.from(list);
    const canAdd = Math.max(0, 9 - images.length);
    if (canAdd <= 0) return;
    setImages((prev) => [...prev, ...arr.slice(0, canAdd)]);
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (!API) return alert("API не настроен (NEXT_PUBLIC_API_BASE)");
    if (!service) return alert("Выбери услугу");
    if (!name.trim()) return alert("Введи имя");

    const fd = new FormData();
    fd.append("serviceTitle", service);
    fd.append("clientName", name.trim());
    if (telegramId) fd.append("telegramId", telegramId);
    fd.append("comment", comment || "");
    images.forEach((f) => fd.append("images", f));

    setLoading(true);
    try {
      const r = await fetch(`${API}/bookings`, { method: "POST", body: fd });
      if (!r.ok) throw new Error("bad status");
      setStep(3);
    } catch {
      alert("Ошибка отправки. Попробуй ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen relative text-white overflow-hidden">
      {/* background */}
      <img
        src="/bg.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover -z-20"
      />
      {/* overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/55 to-black/80" />
      <div className="absolute inset-0 -z-10 backdrop-blur-[2px]" />

      <div className="relative z-10 mx-auto w-full max-w-md px-4 pt-10 pb-8">
        {/* title */}
        <div className="mb-5">
          <h1 className="text-3xl font-semibold tracking-tight">Запись</h1>
          {service ? (
            <div className="mt-1 text-xs opacity-70">{selectedLabel}</div>
          ) : (
            <div className="mt-1 text-xs opacity-60">Выбери услугу и отправь фото/комментарий</div>
          )}
        </div>

        {/* steps */}
        <div className="flex gap-2 mb-5">
          {(["Услуга", "Фото", "Готово"] as const).map((t, idx) => {
            const s = (idx + 1) as Step;
            const active = step === s;
            return (
              <div
                key={t}
                className={[
                  "flex-1 text-center rounded-full px-3 py-2 text-[12px] border transition",
                  active
                    ? "bg-white/90 text-black border-white/20"
                    : "bg-black/25 text-white/70 border-white/10",
                ].join(" ")}
              >
                Шаг {s} · {t}
              </div>
            );
          })}
        </div>

        {/* card */}
        <div className="rounded-[28px] border border-white/12 bg-black/35 backdrop-blur-md shadow-[0_20px_80px_rgba(0,0,0,.45)] p-4">
          {step === 1 && (
            <div className="space-y-3">
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-black/35 backdrop-blur-md border border-white/18 text-sm focus:outline-none"
              >
                <option value="">Выбери услугу</option>
                {SERVICES.map((s) => (
                  <option key={s.title} value={s.title}>
                    {s.title} — {typeof s.price === "number" ? `${s.price} ₽` : s.price}
                  </option>
                ))}
              </select>

              <button
                disabled={!service}
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-2xl bg-white/90 text-black text-sm font-medium active:scale-[0.98] transition disabled:opacity-30"
              >
                Дальше
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Имя"
                className="w-full px-4 py-3 rounded-2xl bg-black/35 border border-white/18 text-sm text-white placeholder:text-white/45 focus:outline-none"
              />

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Комментарий и желаемое время"
                rows={4}
                className="w-full px-4 py-3 rounded-2xl bg-black/35 border border-white/18 text-sm text-white placeholder:text-white/45 focus:outline-none resize-none"
              />

              {/* file button */}
              <label className="block">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                  className="hidden"
                />
                <div className="w-full rounded-2xl border border-white/14 bg-white/10 px-4 py-3 text-sm text-white/90 active:scale-[0.99] transition">
                  Добавить фото ({images.length}/9)
                  <div className="text-[11px] text-white/55 mt-1">Формат: jpg/png/heic</div>
                </div>
              </label>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((f, i) => (
                    <div key={i} className="relative">
                      <img
                        src={URL.createObjectURL(f)}
                        alt=""
                        className="h-24 w-full object-cover rounded-2xl border border-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-black/70 border border-white/10 text-[12px] text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-2xl bg-white/10 border border-white/14 text-white/90 text-sm active:scale-[0.98] transition"
                >
                  Назад
                </button>

                <button
                  onClick={submit}
                  disabled={loading || !name.trim() || !service}
                  className="flex-1 py-3 rounded-2xl bg-white/90 text-black text-sm font-medium active:scale-[0.98] transition disabled:opacity-30"
                >
                  {loading ? "Отправка…" : "Отправить"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-10 text-center">
              <div className="text-lg font-medium">Запись отправлена</div>
              <div className="mt-2 text-sm text-white/70">Мастер свяжется с вами</div>
              <button
                className="mt-6 w-full py-3 rounded-2xl bg-white/10 border border-white/14 text-white/90 text-sm"
                onClick={() => {
                  setStep(1);
                  setService("");
                  setComment("");
                  setImages([]);
                }}
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
