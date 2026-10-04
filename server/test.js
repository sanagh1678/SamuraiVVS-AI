import { fallbackSummary } from "./src/fallback.js";

const input = `
Project Orion will launch on October 18. The support team must complete training by October 12.
The customer requested SSO and audit logs. The security review is still pending.
The project budget is $42,000. The team agreed to hold a final review on October 15.
`;

const output = fallbackSummary(input, 4);

if (!output || !output.includes("October")) {
  throw new Error("Fallback summarizer test failed.");
}

console.log("Fallback summarizer test passed.");
