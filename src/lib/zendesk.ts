import type { ZendeskConfig } from "./types";

interface RawSignal {
  channel: string;
  sender: string;
  content: string;
  timestamp: string;
}

export async function fetchZendeskTickets(config: ZendeskConfig): Promise<RawSignal[]> {
  const { subdomain, email, api_token, last_sync } = config;
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

  return tickets
    .filter((t) => t.description && t.subject)
    .map((t) => ({
      channel: `ticket-${t.id}`,
      sender: `requester:${t.requester_id}`,
      content: `Subject: ${t.subject}\n\n${t.description}`,
      timestamp: t.created_at,
    }));
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
