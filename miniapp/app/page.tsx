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
  const [service, setService] = useState<string>("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 9);
    setImages(files);
  }

  async function submit() {
    if (!service) return alert("Выбери услугу");

    const fd = new FormData();
    fd.append("serviceTitle", service);
    fd.append("comment", comment);
    images.forEach((f) => fd.append("images", f));

    setLoading(true);
    await fetch(`${API}/bookings`, {
      method: "POST",
      body: fd,
    });
    setLoading(false);

    setService("");
    setComment("");
    setImages([]);
    alert("Запись отправлена ✨");
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
        <h1 className="text-3xl font-semibold text-center mb-4">Запись</h1>

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
              <img
                key={i}
                src={URL.createObjectURL(file)}
                className="h-24 w-full object-cover rounded-xl border border-white/10"
              />
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

        <p className="text-xs text-neutral-300 mt-2 text-center">
          Дизайн, снятие, ремонт, маникюр, укрепление и т.д. входят в стоимость
        </p>
      </div>
    </main>
  );
}
