const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });


const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const bookings = []; // временно в памяти

// создать запись
app.post("/bookings", upload.array("images"), (req, res) => {
  const { serviceTitle, servicePrice, date, clientName, comment } = req.body;

  // ❌ если дата уже занята — не принимаем
  if (bookings.find(b => b.date === date)) {
    return res.status(409).json({ error: "DATE_BUSY" });
  }

  bookings.push({
    serviceTitle,
    servicePrice,
    date,
    clientName,
    comment,
    createdAt: new Date().toISOString(),
  });

  console.log("NEW BOOKING:", date, clientName);
  res.json({ ok: true });
});

// получить все записи (для мастера / админки)
app.get("/bookings", (req, res) => {
  res.json(bookings);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log("Backend running on http://localhost:" + PORT);
});