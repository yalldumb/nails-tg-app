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

  const [animKey, setAnimKey] = useState(0);
  useEffect(() => setAnimKey((k) => k + 1), [step]);

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
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, 9 - images.length);
    if (list.length) setImages((p) => [...p, ...list]);
  }

  function removeImage(i: number) {
    setImages((p) => p.filter((_, idx) => idx !== i));
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
    <main className="min-h-screen relative text-white pb-24">
      <img src="/bg.jpg" className="absolute inset-0 w-full h-full object-cover z-0" />
      <div className="absolute inset-0 bg-black/55 z-0" />

      <div className="relative z-10 max-w-md mx-auto px-2 py-3">
        {/* steps */}
        <div className="flex gap-1.5 mb-2 text-[11px]">
          {[
            { s: 1, t: "Услуга" },
            { s: 2, t: "Фото" },
            { s: 3, t: "Готово" },
          ].map((x) => (
            <div
              key={x.s}
              className={[
                "px-2 py-1 rounded-full border whitespace-nowrap",
                step === x.s
                  ? "bg-white text-black border-white/80"
                  : "bg-white/5 border-white/10 opacity-70",
              ].join(" ")}
            >
              {x.t}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/35 backdrop-blur-md p-2">
          <div key={animKey} className="animIn">
            {step === 1 && (
              <div className="flex flex-col gap-2">
                {SERVICES.map((s) => {
                  const selected = service === s.title;
                  const dim = service && !selected;
                  return (
                    <button
                      key={s.title}
                      onClick={() => {
                        setService(s.title);
                        setStep(2);
                      }}
                      className={[
                        "w-full rounded-lg border px-3 py-2 text-left transition",
                        selected
                          ? "bg-white/15 border-white/30"
                          : "bg-white/5 border-white/10",
                        dim ? "opacity-55" : "opacity-100",
                      ].join(" ")}
                    >
                      <div className="text-[11px] opacity-80">{s.title}</div>
                      <div className="text-[15px] font-medium">
                        {typeof s.price === "number" ? `${s.price} ₽` : s.price}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Имя"
                  className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-[12px]"
                />
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Комментарий и желаемое время"
                  rows={2}
                  className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-[12px]"
                />

                <label className="inline-block px-3 py-2 rounded-lg bg-white/8 border border-white/10 text-[11px]">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && addFiles(e.target.files)}
                    className="hidden"
                  />
                  Фото ({images.length}/9)
                </label>

                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {previews.map((src, i) => (
                      <div key={src} className="relative">
                        <img src={src} className="h-16 w-full object-cover rounded-md" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-0.5 right-0.5 h-5 w-5 bg-black/70 rounded-full text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-6">
                <div className="text-[14px] font-medium">Готово</div>
                <div className="text-[11px] opacity-70">Мастер свяжется с вами</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* sticky bottom button: только на шаге 2 */}
      {step === 2 && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-black/70 backdrop-blur-md border-t border-white/10 p-3">
          <button
            onClick={submit}
            disabled={!name.trim() || loading}
            className="w-full py-3 rounded-xl bg-white text-black text-[13px] disabled:opacity-40"
          >
            {loading ? "Отправка…" : "Отправить"}
          </button>
        </div>
      )}

      <style jsx global>{`
        .animIn {
          animation: animIn 180ms ease-out both;
        }
        @keyframes animIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
