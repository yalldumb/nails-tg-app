require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

const services = [
  { id: 1, title: "Маникюр", price: 2000, duration_minutes: 90 },
  { id: 2, title: "Маникюр + дизайн", price: 3000, duration_minutes: 130 },
  { id: 3, title: "Снятие", price: 500, duration_minutes: 30 },
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

app.get("/availability", (req,res)=>{
  const { date, serviceId } = req.query;
  if (!date || !serviceId) return res.status(400).json({ error: "date and serviceId required" });
  const service = services.find(s=>String(s.id)===String(serviceId));
  if (!service) return res.status(404).json({ error: "service not found" });

  const start=timeToMinutes("10:00"), end=timeToMinutes("20:00"), step=15;
  const slots=[];
  for (let t=start; t+service.duration_minutes<=end; t+=step) slots.push(minutesToTime(t));
  res.json({ slots });
});

app.post("/bookings", (req,res)=>{
  const { clientName, clientTelegramId, serviceId, date, time, comment } = req.body || {};
  if (!clientName || !serviceId || !date || !time) return res.status(400).json({ error: "missing required fields" });

  const service = services.find(s=>String(s.id)===String(serviceId));
  if (!service) return res.status(404).json({ error: "service not found" });

  const conflict = bookings.find(b=>b.date===date && b.time===time);
  if (conflict) return res.status(409).json({ error: "slot already booked" });

  const booking = { id: Date.now(), clientName, clientTelegramId: clientTelegramId||null, serviceTitle: service.title, date, time, comment: comment||"" };
  bookings.push(booking);
  res.json({ ok: true, booking });
});

app.get("/my-bookings", (req,res)=>{
  const { clientTelegramId } = req.query;
  if (!clientTelegramId) return res.status(400).json({ error: "clientTelegramId required" });
  res.json({ bookings: bookings.filter(b=>String(b.clientTelegramId||"")===String(clientTelegramId)) });
});

app.listen(PORT, ()=>console.log(`✅ Backend running on http://localhost:${PORT}`));
