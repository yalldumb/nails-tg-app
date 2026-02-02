require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

const services = [
  { id: 1, title: "Натуральные ногти", price: 3000, duration_minutes: 334346464 },

  { id: 2, title: "Наращивание/Коррекция — Короткие", price: 3500, duration_minutes: 150 },
  { id: 3, title: "Наращивание/Коррекция — Средние", price: 4000, duration_minutes: 170 },
  { id: 4, title: "Наращивание/Коррекция — Длинные", price: 4500, duration_minutes: 190 },
  { id: 5, title: "Наращивание/Коррекция — Длинные+", price: 5000, duration_minutes: 210 },
  { id: 6, title: "Наращивание/Коррекция — Экстра", price: 7000, duration_minutes: 240 },
  { id: 7, title: "Наращивание/Коррекция — Экстра+", price: 8000, duration_minutes: 270 },

  { id: 8, title: "Когти (доп.)", price: 1000, duration_minutes: 30 },
];

let bookings = [];

function timeToMinutes(t) { const [h,m]=t.split(":").map(Number); return h*60+m; }
function minutesToTime(mins) { const h=Math.floor(mins/60), m=mins%60; return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`; }
app.get("/", (req, res) => {
  res.type("html").send(`
    <div style="font-family: ui-sans-serif, system-ui; padding: 24px;">
      <h2>✅ Nails backend is running</h2>
      <p>Try:</p>
      <ul>
        <li><a href="/health">/health</a></li>
        <li><a href="/services">/services</a></li>
      </ul>
    </div>
  `);
});
app.get("/health", (req,res)=>res.json({ok:true}));
app.get("/services", (req,res)=>res.json({services}));

app.post("/bookings", (req,res)=>{
  const { clientName, clientTelegramId, serviceId, date, comment } = req.body || {};
  if (!clientName || !serviceId || !date) return res.status(400).json({ error: "missing required fields" });

  const service = services.find(s=>String(s.id)===String(serviceId));
  if (!service) return res.status(404).json({ error: "service not found" });

  const booking = { id: Date.now(), clientName, clientTelegramId: clientTelegramId||null, serviceTitle: service.title, date, comment: comment||"" };
  bookings.push(booking);
  res.json({ ok: true, booking });
});

app.get("/my-bookings", (req,res)=>{
  const { clientTelegramId } = req.query;
  if (!clientTelegramId) return res.status(400).json({ error: "clientTelegramId required" });
  res.json({ bookings: bookings.filter(b=>String(b.clientTelegramId||"")===String(clientTelegramId)) });
});

app.listen(PORT, ()=>console.log(`✅ Backend running on http://localhost:${PORT}`));
