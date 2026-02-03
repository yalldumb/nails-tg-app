"use client";

const SERVICES = [
  { title: "Натуральные ногти", price: "3000 ₽" },
  { title: "Короткие", price: "3500 ₽" },
  { title: "Средние", price: "4000 ₽" },
  { title: "Длинные", price: "4500 ₽" },
  { title: "Длинные+", price: "5000 ₽" },
  { title: "Экстра", price: "7000 ₽" },
  { title: "Экстра+", price: "8000 ₽" },
  { title: "Когти", price: "+1000 ₽" },
];

export default function Page() {
  return (
    <main className="min-h-screen relative text-white">
      <img
        src="/bg.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover -z-10"
      />
      <div className="absolute inset-0 bg-black/60 -z-10" />

      <div className="relative z-10 max-w-md mx-auto p-4 space-y-4">
        <h1 className="text-3xl font-semibold text-center mb-6">Запись</h1>

        {SERVICES.map((s, i) => (
          <div
            key={i}
            className="flex justify-between items-center p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/10"
          >
            <span>{s.title}</span>
            <span className="font-medium">{s.price}</span>
          </div>
        ))}

        <p className="text-xs text-neutral-300 mt-4 text-center">
          Дизайн, снятие, ремонт, маникюр, укрепление и т.д. входят в стоимость
        </p>
      </div>
    </main>
  );
}