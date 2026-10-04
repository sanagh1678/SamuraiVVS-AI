import express from "express";
import cors from "cors";
import { summarize } from "./summarizer.js";

const app = express();
const PORT = Number(process.env.PORT || 8787);
const MAX_INPUT_CHARS = Number(process.env.MAX_INPUT_CHARS || 300000);

app.use(cors({
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "claritysum-server" });
});

app.post("/api/summarize", async (req, res) => {
  try {
    const { text, maxLength = "balanced" } = req.body || {};

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Text is required." });
    }

    if (text.length > MAX_INPUT_CHARS) {
      return res.status(413).json({
        error: `Text is too long. Maximum input is ${MAX_INPUT_CHARS} characters.`
      });
    }

    if (!["short", "balanced", "detailed"].includes(maxLength)) {
      return res.status(400).json({ error: "Invalid maxLength." });
    }

    const result = await summarize(text, maxLength);

    res.json({
      summary: result.summary,
      method: result.method,
      model: result.model,
      sourceCharacters: text.length
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to summarize the supplied text." });
  }
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`ClaritySum server running at http://127.0.0.1:${PORT}`);
});
