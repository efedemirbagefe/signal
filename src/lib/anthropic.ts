import Anthropic from "@anthropic-ai/sdk";
import type { Signal, AnalysisResult } from "./types";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function analyzeSignals(signals: Signal[]): Promise<AnalysisResult[]> {
  const signalTexts = signals.map((s) => `[${s.source.toUpperCase()}][${s.channel}] ${s.content}`).join("\n");

  const message = await getClient().messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    system: `You are a product intelligence engine. Analyze these raw signals from Slack, Email, WhatsApp, Zendesk, Intercom, Jira, App Store reviews, GitHub Issues, and Reddit.
Group them into themes called Intent Gaps. For each gap return:
- title: short descriptive name
- severity: 0-100 score
- confidence: 0-1 float
- evidence_count: number of signals
- source_breakdown: {slack: n, email: n, whatsapp: n, zendesk: n, intercom: n, jira: n, appstore: n, github: n, reddit: n}
- business_case: one sentence impact statement
- recommended_action: what to build or fix
- customer_quote: most representative signal verbatim
Return ONLY a valid JSON array with no other text or markdown.`,
    messages: [
      {
        role: "user",
        content: `Analyze these ${signals.length} signals and identify intent gaps:\n\n${signalTexts}`,
      },
    ],
  });

  const rawText = message.content[0].type === "text" ? message.content[0].text : "[]";

  // Strip markdown code fences Claude sometimes wraps the JSON in
  const text = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  let parsed: AnalysisResult[];
  try {
    parsed = JSON.parse(text) as AnalysisResult[];
  } catch (parseErr) {
    console.error("[analyzeSignals] Failed to parse Claude response as JSON:", parseErr, "\nRaw response:", rawText);
    throw new Error("AI returned an unexpected format — please try the analysis again.");
  }
  return parsed;
}

export async function generateIntentSnapshot(cluster: import("./types").Cluster) {
  const message = await getClient().messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    system: "You are a senior product manager. Generate a precise intent snapshot for the given product gap. Return valid JSON only.",
    messages: [
      {
        role: "user",
        content: `Generate an intent snapshot for this product gap:
Title: ${cluster.title}
Business Case: ${cluster.business_case}
Recommended Action: ${cluster.recommended_action}
Evidence Count: ${cluster.evidence_count}
Customer Quote: "${cluster.customer_quote}"

Return JSON with: problem_statement, recommended_solution, acceptance_criteria (array of strings), success_metrics (array of strings), effort_estimate (string like "S/M/L - X sprints")`,
      },
    ],
  });

  const rawText = message.content[0].type === "text" ? message.content[0].text : "{}";
  const text = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export async function generateSlackBrief(cluster: import("./types").Cluster) {
  const message = await getClient().messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Write a concise Slack message brief for this product gap. 2-3 sentences max. Include severity emoji (🔴 high, 🟡 medium, 🟢 low).
Title: ${cluster.title}
Business Case: ${cluster.business_case}
Severity: ${cluster.severity}/100`,
      },
    ],
  });
  return message.content[0].type === "text" ? message.content[0].text : "";
}
