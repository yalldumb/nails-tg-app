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
  filename: (_, file, cb) =>
    cb(null, Date.now() + "-" + Math.random().toString(36).slice(2) + path.extname(file.originalname)),
});

const upload = multer({ storage, limits: { files: 9 } });
app.use("/uploads", express.static(UPLOAD_DIR));

/* ---------- data ---------- */
let bookings = [];

/* ---------- routes ---------- */
app.get("/health", (_, res) => res.json({ ok: true }));

app.post("/bookings", upload.array("images", 9), (req, res) => {
  const { serviceTitle, comment, clientName, telegramId } = req.body;
  if (!serviceTitle || !clientName)
    return res.status(400).json({ error: "missing fields" });

  const images = (req.files || []).map((f) => `/uploads/${f.filename}`);

  bookings.unshift({
    id: Date.now(),
    serviceTitle,
    clientName,
    telegramId: telegramId || null,
    comment: comment || "",
    images,
    createdAt: new Date().toISOString(),
  });

  res.json({ ok: true });
});

app.listen(PORT, () =>
  console.log(`✅ Backend running on http://localhost:${PORT}`)
);
