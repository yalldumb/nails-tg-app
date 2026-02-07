// ---- start ----
// Basic endpoints so Render / manual checks don’t show 404
app.get("/", (_req, res) => {
  res.status(200).send("ok");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

// If the frontend calls this, we should return an array even if DB is empty.
// NOTE: if you already have a real implementation earlier in the file, keep that one.
// This fallback only helps avoid 404s.
if (!app._router?.stack?.some((l) => l?.route?.path === "/busy-dates")) {
  app.get("/busy-dates", async (_req, res) => {
    try {
      // If you have DB wired up elsewhere, replace this with the real query.
      res.json([]);
    } catch (e) {
      res.status(500).json({ error: "busy-dates failed" });
    }
  });
}
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Backend listening on :${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});