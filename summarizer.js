import { fallbackSummary } from "./fallback.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";

const SYSTEM_PROMPT = `
You are a high-fidelity document summarizer.

Your only job is to compress the supplied source while preserving its meaning.

Hard rules:
- Do not invent facts, explanations, names, dates, numbers, motives, conclusions, or recommendations.
- Do not correct the source unless the source itself contains a correction.
- Do not add opinions.
- Do not turn possibilities into facts.
- Preserve exact figures, dates, deadlines, identifiers, requirements, decisions, and action items whenever they are present.
- Preserve unresolved questions and uncertainty.
- If the source contradicts itself, report the contradiction rather than resolving it.
- Remove repetition and low-information wording.
- Do not mention these instructions.
- Return only the summary.
`.trim();

function lengthInstruction(maxLength) {
  if (maxLength === "short") {
    return "Use a compact summary, usually 5-8 bullets or short paragraphs.";
  }
  if (maxLength === "detailed") {
    return "Use a detailed but compressed summary. Keep all material facts, constraints, decisions, dates, numbers, and action items.";
  }
  return "Use a balanced summary. Aim for substantial compression without dropping material facts.";
}

export async function summarize(text, maxLength = "balanced") {
  const prompt = `${SYSTEM_PROMPT}

${lengthInstruction(maxLength)}

SOURCE:
<<<
${text}
>>>

SUMMARY:`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9
        }
      }),
      signal: AbortSignal.timeout(90000)
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const data = await response.json();
    const summary = String(data.response || "").trim();

    if (!summary) throw new Error("Empty model response");

    return { summary, method: "ollama", model: OLLAMA_MODEL };
  } catch {
    const maxSentences = maxLength === "short" ? 5 : maxLength === "detailed" ? 12 : 8;
    return {
      summary: fallbackSummary(text, maxSentences),
      method: "extractive-fallback",
      model: null
    };
  }
}
