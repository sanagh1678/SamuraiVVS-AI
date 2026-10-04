const STOPWORDS = new Set([
  "the","and","for","that","with","this","from","have","will","your","are","was",
  "were","has","had","but","not","you","they","their","there","which","when",
  "what","where","who","how","can","could","would","should","about","into","than",
  "then","them","our","out","all","any","more","also","been","being","its","it's",
  "his","her","she","him","may","might","must","does","did","doing","just","only",
  "very","some","such","these","those","a","an","in","on","of","to","is","as","at",
  "by","or","if","it","be","we","i","me","my","he","do"
]);

function tokenize(sentence) {
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreSentence(sentence, frequencies) {
  const words = tokenize(sentence);
  if (!words.length) return 0;

  let score = 0;
  for (const word of words) {
    if (!STOPWORDS.has(word)) score += frequencies.get(word) || 0;
  }

  const lengthBonus = Math.min(words.length / 18, 1);
  const numberBonus = /\d/.test(sentence) ? 1.4 : 0;
  const actionBonus = /\b(action|deadline|due|must|required|need|decision|next|owner|follow[- ]?up)\b/i.test(sentence) ? 2.0 : 0;

  return (score / Math.sqrt(words.length)) + lengthBonus + numberBonus + actionBonus;
}

export function fallbackSummary(text, maxSentences = 8) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (!normalized) return "";

  const sentences = normalized
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map(s => s.trim())
    .filter(s => s.length > 25);

  if (sentences.length <= maxSentences) {
    return sentences.join(" ");
  }

  const frequencies = new Map();
  for (const sentence of sentences) {
    for (const word of tokenize(sentence)) {
      if (!STOPWORDS.has(word) && word.length > 2) {
        frequencies.set(word, (frequencies.get(word) || 0) + 1);
      }
    }
  }

  const ranked = sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score: scoreSentence(sentence, frequencies)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index);

  return ranked.map(item => item.sentence).join(" ");
}
