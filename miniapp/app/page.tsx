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

async function compressImage(file: File): Promise<File> {
  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  await new Promise((r) => (img.onload = r));

  const canvas = document.createElement("canvas");
  const max = 1200;
  let { width, height } = img;
  if (width > height && width > max) {
    height = (height * max) / width;
    width = max;
  } else if (height > max) {
    width = (width * max) / height;
    height = max;
  }

  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

  const blob: Blob = await new Promise((r) =>
    canvas.toBlob((b) => r(b!), "image/jpeg", 0.8)
  );

  return new File([blob], file.name, { type: "image/jpeg" });
}

export default function Page() {
  const [step, setStep] = useState<Step>(1);
  const [service, setService] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---- persist ---- */
  useEffect(() => {
    const saved = localStorage.getItem("booking");
    if (saved) {
      const d = JSON.parse(saved);
      setStep(d.step);
      setService(d.service);
      setComment(d.comment);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "booking",
      JSON.stringify({ step, service, comment })
    );
  }, [step, service, comment]);

  async function addFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, 9 - images.length);
    const compressed = await Promise.all(list.map(compressImage));
    setImages((prev) => [...prev, ...compressed]);
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

    localStorage.removeItem("booking");
    setStep(3);
  }

  return (
    <main className="min-h-screen relative text-white transition-all duration-500">
      <img
        src="/bg.jpg"
        className="absolute inset-0 w-full h-full object-cover -z-10"
      />
      <div className="absolute inset-0 bg-black/60 -z-10" />

      <div className="relative z-10 max-w-md mx-auto p-4 space-y-4 animate-fadeIn">
        <h1 className="text-3xl font-semibold text-center">Запись</h1>

        {step === 1 && (
          <div className="space-y-3 animate-slideUp">
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10"
            >
              <option value="">Выбери услугу</option>
              {SERVICES.map((s) => (
                <option key={s.title} value={s.title}>
                  {s.title} —{" "}
                  {typeof s.price === "number" ? `${s.price} ₽` : s.price}
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
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 animate-slideUp">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий и желаемое время"
              className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10"
              rows={4}
            />

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
              className="border border-dashed border-white/20 rounded-xl p-4 text-center text-sm"
            >
              Перетащи фото сюда или выбери ниже
            </div>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              className="w-full text-sm"
            />

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((f, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(f)}
                      className="h-24 w-full object-cover rounded-xl"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 h-6 w-6 bg-black/70 rounded-full text-xs"
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
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-2 animate-fadeIn">
            <div className="text-3xl">✨</div>
            <div className="text-lg font-medium">Запись отправлена</div>
            <p className="text-sm opacity-70">
              Мастер свяжется с вами
            </p>
          </div>
        )}

        <p className="text-xs text-neutral-300 text-center">
          Дизайн, снятие, ремонт, маникюр, укрепление входят в стоимость
        </p>
      </div>

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.35s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0 }
          to { transform: translateY(0); opacity: 1 }
        }
      `}</style>
    </main>
  );
}
