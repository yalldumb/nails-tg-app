require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

/* ---------- uploads ---------- */
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + Math.random().toString(36).slice(2) + ext);
  },
});

const upload = multer({
  storage,
  limits: { files: 9 },
});

app.use("/uploads", express.static(UPLOAD_DIR));

/* ---------- data ---------- */
const services = [
  { id: 1, title: "Натуральные ногти", price: 3000 },
  { id: 2, title: "Короткие", price: 3500 },
  { id: 3, title: "Средние", price: 4000 },
  { id: 4, title: "Длинные", price: 4500 },
  { id: 5, title: "Длинные+", price: 5000 },
  { id: 6, title: "Экстра", price: 7000 },
  { id: 7, title: "Экстра+", price: 8000 },
  { id: 8, title: "Когти", price: 1000 },
];

let bookings = [];

/* ---------- routes ---------- */
app.get("/health", (_, res) => res.json({ ok: true }));
app.get("/services", (_, res) => res.json({ services }));

app.post("/bookings", upload.array("images", 9), (req, res) => {
  const { serviceTitle, comment } = req.body;

  if (!serviceTitle)
    return res.status(400).json({ error: "serviceTitle required" });

  const images = (req.files || []).map(
    (f) => `/uploads/${f.filename}`
  );

  const booking = {
    id: Date.now(),
    serviceTitle,
    comment: comment || "",
    images,
    createdAt: new Date().toISOString(),
  };

  bookings.unshift(booking);
  res.json({ ok: true });
});

app.get("/admin/bookings", (req, res) => {
  const token = req.headers["x-admin-token"];
  if (token !== process.env.ADMIN_TOKEN)
    return res.status(401).json({ error: "unauthorized" });

  res.json({ bookings });
});

app.listen(PORT, () =>
  console.log(`✅ Backend running on http://localhost:${PORT}`)
);
