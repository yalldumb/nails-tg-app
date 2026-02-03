"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

const SERVICES = [
  "Натуральные ногти",
  "Короткие",
  "Средние",
  "Длинные",
  "Длинные+",
  "Экстра",
  "Экстра+",
  "Когти",
];

export default function Page() {
  const [service, setService] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!service) return;

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
    <main className="min-h-screen text-white bg-neutral-950 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-semibold text-center">Запись</h1>

        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10"
        >
          <option value="">Выбери услугу</option>
          {SERVICES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <textarea
          placeholder="Комментарий (можно указать время)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10"
          rows={4}
        />

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) =>
            setImages(Array.from(e.target.files || []).slice(0, 9))
          }
          className="w-full text-sm"
        />

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
      </div>
    </main>
  );
}
