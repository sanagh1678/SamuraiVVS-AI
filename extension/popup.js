const API_URL = "http://127.0.0.1:8787/api/summarize";

const source = document.getElementById("source");
const summary = document.getElementById("summary");
const length = document.getElementById("length");
const message = document.getElementById("message");
const method = document.getElementById("method");
const statusDot = document.getElementById("statusDot");

function setMessage(text, isError = false) {
  message.textContent = text;
  message.className = isError ? "message error" : "message";
}

function setBusy(busy) {
  const button = document.getElementById("summarizeButton");
  button.disabled = busy;
  button.textContent = busy ? "Working…" : "Summarize";
}

async function getCurrentPageText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab.");

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const selected = window.getSelection()?.toString()?.trim();
      if (selected) return selected;

      const root = document.body;
      return root ? root.innerText : "";
    }
  });

  return results?.[0]?.result || "";
}

document.getElementById("pageButton").addEventListener("click", async () => {
  try {
    setMessage("Reading the current page…");
    const text = await getCurrentPageText();

    if (!text.trim()) {
      throw new Error("No readable text was found on this page.");
    }

    source.value = text;
    setMessage(`${text.length.toLocaleString()} characters loaded.`);
  } catch (error) {
    setMessage(error.message || "Could not read the page.", true);
  }
});

document.getElementById("clearButton").addEventListener("click", () => {
  source.value = "";
  summary.textContent = "Your summary will appear here.";
  method.textContent = "";
  setMessage("");
});

document.getElementById("summarizeButton").addEventListener("click", async () => {
  const text = source.value.trim();

  if (!text) {
    setMessage("Add source text or load the current page first.", true);
    return;
  }

  setBusy(true);
  setMessage("Creating a faithful summary…");
  statusDot.className = "status-dot";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        maxLength: length.value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "The server rejected the request.");
    }

    summary.textContent = data.summary || "No summary returned.";
    method.textContent = data.method === "ollama"
      ? `Local model: ${data.model}`
      : "Extractive fallback";
    statusDot.className = "status-dot ok";
    setMessage(`Processed ${data.sourceCharacters.toLocaleString()} characters.`);
  } catch (error) {
    statusDot.className = "status-dot error";
    setMessage(
      "Could not reach the local server. Start it with: cd server && npm install && npm start",
      true
    );
  } finally {
    setBusy(false);
  }
});

document.getElementById("copyButton").addEventListener("click", async () => {
  const text = summary.textContent.trim();
  if (!text || text === "Your summary will appear here.") return;

  try {
    await navigator.clipboard.writeText(text);
    setMessage("Summary copied.");
  } catch {
    setMessage("Copy failed. Select the summary and copy it manually.", true);
  }
});
