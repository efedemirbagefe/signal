export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { fetchGmailMessages } from "@/lib/email";
import { getWorkspace, insertSignals } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { workspaceId } = await req.json();
  const wid = workspaceId ?? "00000000-0000-0000-0000-000000000001";

  const workspace = await getWorkspace(wid);
  if (!workspace.gmail_token) {
    return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
  }

  const messages = await fetchGmailMessages(workspace.gmail_token);

  const signals = messages.map((m) => ({
    workspace_id: wid,
    source: "email" as const,
    channel: m.channel,
    sender: m.sender,
    content: m.content,
    timestamp: m.timestamp,
    reviewed: false,
  }));

  const inserted = await insertSignals(signals);
  return NextResponse.json({ ingested: inserted?.length ?? 0 });
}
