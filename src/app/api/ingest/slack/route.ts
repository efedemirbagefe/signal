export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { fetchSlackMessages } from "@/lib/slack";
import { getWorkspace, insertSignals } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { workspaceId } = await req.json();
  const wid = workspaceId ?? "00000000-0000-0000-0000-000000000001";

  const workspace = await getWorkspace(wid);
  if (!workspace.slack_token) {
    return NextResponse.json({ error: "Slack not connected" }, { status: 400 });
  }

  const channels = workspace.slack_monitored_channels ?? [];
  if (channels.length === 0) {
    return NextResponse.json({ error: "No channels configured" }, { status: 400 });
  }

  const messages = await fetchSlackMessages(workspace.slack_bot_token ?? workspace.slack_token, channels);

  const signals = messages.map((m) => ({
    workspace_id: wid,
    source: "slack" as const,
    channel: m.channel,
    sender: m.sender,
    content: m.content,
    timestamp: m.timestamp,
    reviewed: false,
  }));

  const inserted = await insertSignals(signals);
  return NextResponse.json({ ingested: inserted?.length ?? 0 });
}
