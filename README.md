# SamuraiVVS-AI

SamuraiVVS-AI is a Chrome extension for producing faithful, compact summaries of long emails, support tickets, documents, and web pages.

## What it does

- Summarizes selected text or the visible text of the current page.
- Keeps important facts, names, dates, numbers, decisions, requirements, and action items.
- Avoids inventing information.
- Uses a conservative summarization prompt designed for factual fidelity.
- Runs the model through a local backend so API credentials are never stored in the extension.
- Supports Ollama locally, with a deterministic extractive fallback when a model is unavailable.
- Includes a small HTTP API that can also be used by other clients later.

## Architecture

```text
Chrome tab
   |
   | selected text / visible page text
   v
Chrome Extension
   |
   | POST /api/summarize
   v
Local Node.js server
   |
   +--> Ollama (optional local LLM)
   |
   +--> Extractive fallback
```

## Requirements

- Google Chrome with Manifest V3 support
- Node.js 18+
- Optional: Ollama for higher-quality model summaries

## 1. Start the server

```bash
cd server
npm install
npm start
```

The API listens on `http://localhost:8787`.

### Optional Ollama setup

Install Ollama, then pull a model:

```bash
ollama pull llama3.2:3b
```

Set the model if you want another one:

```bash
# macOS/Linux
export OLLAMA_MODEL=llama3.2:3b

# Windows PowerShell
$env:OLLAMA_MODEL="llama3.2:3b"
```

The server automatically uses Ollama when it is reachable. If it is not available, the fallback summarizer still works.

## 2. Load the extension

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `extension` folder.
5. Open any email, ticket, document, or web page.
6. Click the ClaritySum extension icon.
7. Choose **Use current page** or paste text manually.
8. Click **Summarize**.

## 3. API usage

### Request

```http
POST /api/summarize
Content-Type: application/json
```

```json
{
  "text": "Long source text...",
  "maxLength": "balanced"
}
```

### Response

```json
{
  "summary": "...",
  "method": "ollama",
  "sourceCharacters": 12345
}
```

## Design principles

The summarizer is intentionally conservative:

1. No new facts.
2. No recommendations unless present in the source.
3. Preserve names, dates, quantities, requirements, decisions, and unresolved questions.
4. Mark uncertainty rather than silently resolving it.
5. Prefer omission of low-value repetition over omission of substantive facts.
6. Keep the summary shorter than the source while retaining high-information content.

## Project structure

```text
claritysum/
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   └── icons/
├── server/
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── summarizer.js
│       └── fallback.js
├── .gitignore
├── LICENSE
└── README.md
```

## GitHub

Create a repository, then:

```bash
git init
git add .
git commit -m "Initial ClaritySum project"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

Do not commit secrets or private documents.

## Notes

The local fallback is designed to keep the project usable without a model, but an LLM generally produces better summaries for complex documents. For sensitive company material, a local Ollama model is a practical option because source text can remain on the machine.
