"use client";

import { useState } from "react";

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

export default function Page() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [service, setService] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 9);
    setImages((prev) => [...prev, ...files].slice(0, 9));
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    const fd = new FormData();
    fd.append("serviceTitle", service);
    fd.append("comment", comment);
    images.forEach((f) => fd.append("images", f));

    setLoading(true);
    await fetch(`${API}/bookings`, { method: "POST", body: fd });
    setLoading(false);

    setStep(3);
  }

  return (
    <main className="min-h-screen relative text-white">
      <img
        src="/bg.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover -z-10"
      />
      <div className="absolute inset-0 bg-black/60 -z-10" />

      <div className="relative z-10 max-w-md mx-auto p-4 space-y-4">
        <h1 className="text-3xl font-semibold text-center">Запись</h1>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10"
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
              className="w-full py-3 rounded-2xl bg-white text-black disabled:opacity-40"
            >
              Дальше
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <textarea
              placeholder="Комментарий (можно указать желаемое время)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10"
              rows={4}
            />

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={onFiles}
              className="w-full text-sm"
            />

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((file, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      className="h-24 w-full object-cover rounded-xl border border-white/10"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-white text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs opacity-60">
              Фото: {images.length} / 9
            </div>

            <button
              onClick={submit}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-white text-black disabled:opacity-40"
            >
              {loading ? "Отправка…" : "Отправить"}
            </button>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="text-center space-y-3">
            <div className="text-2xl">✨</div>
            <div className="text-lg font-medium">Запись отправлена</div>
            <p className="text-sm opacity-70">
              Мастер свяжется с вами в ближайшее время
            </p>
          </div>
        )}

        <p className="text-xs text-neutral-300 text-center">
          Дизайн, снятие, ремонт, маникюр, укрепление и т.д. входят в стоимость
        </p>
      </div>
    </main>
  );
}
