import type { ZendeskConfig } from "./types";

interface RawSignal {
  channel: string;
  sender: string;
  content: string;
  timestamp: string;
}

// Numeric rank for Zendesk priority levels.
// Enables threshold comparison: only ingest tickets at or above the configured minimum.
const ZENDESK_PRIORITY_RANK: Record<string, number> = {
  low: 1,
  normal: 2,
  high: 3,
  urgent: 4,
};

export async function fetchZendeskTickets(config: ZendeskConfig): Promise<RawSignal[]> {
  const {
    subdomain,
    email,
    api_token,
    last_sync,
    min_priority = "normal", // "low" tickets are minor; "normal"+ = real customer problems
    exclude_closed = true,   // Closed/solved = already handled, not active signals
  } = config;

  const credentials = Buffer.from(`${email}/token:${api_token}`).toString("base64");
  const headers = {
    "Authorization": `Basic ${credentials}`,
    "Content-Type": "application/json",
  };

  let url: string;
  if (last_sync) {
    const unixTime = Math.floor(new Date(last_sync).getTime() / 1000);
    url = `https://${subdomain}.zendesk.com/api/v2/incremental/tickets.json?start_time=${unixTime}`;
  } else {
    url = `https://${subdomain}.zendesk.com/api/v2/tickets.json?sort_by=created_at&sort_order=desc&page[size]=100`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Zendesk API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as { tickets?: ZendeskTicket[] };
  const tickets: ZendeskTicket[] = data.tickets ?? [];

  // ── THRESHOLD GATE 1: Priority floor ──────────────────────────────────────
  // Zendesk tickets without a priority set default to "normal" (rank 2).
  // This treats unclassified tickets as standard — they still pass a normal+ filter.
  // Raise min_priority to "high" or "urgent" for high-volume support desks
  // where normal tickets are routine and only escalations are signal-worthy.
  const minRank = ZENDESK_PRIORITY_RANK[min_priority] ?? 2;

  return tickets
    .filter((t) => t.description && t.subject)

    // ── THRESHOLD GATE 2: Status exclusion ──────────────────────────────────
    // "closed" = ticket locked after solving; "solved" = agent marked as resolved.
    // Both statuses indicate the issue is no longer active — not a live signal.
    // Keep "pending" (waiting for user), "open", and "on-hold" as active signals.
    .filter((t) => {
      if (!exclude_closed) return true;
      return t.status !== "closed" && t.status !== "solved";
    })

    .filter((t) => {
      const rank = ZENDESK_PRIORITY_RANK[t.priority ?? "normal"] ?? 2;
      return rank >= minRank;
    })

    .map((t) => {
      // Enrich content with priority label as a prefix so the AI clustering
      // pipeline can weight high/urgent tickets more heavily in its analysis.
      const priorityLabel = (t.priority ?? "normal").toUpperCase();
      return {
        channel: `ticket-${t.id}`,
        sender: `requester:${t.requester_id}`,
        content: `[${priorityLabel}] ${t.subject}\n\n${t.description}`,
        timestamp: t.created_at,
      };
    });
}

interface ZendeskTicket {
  id: number;
  subject: string;
  description: string;
  requester_id: number;
  created_at: string;
  status: string;
  priority: string | null;
  tags: string[];
}
