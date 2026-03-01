export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { fetchIntercomConversations } from "@/lib/intercom";
import { getWorkspace, insertSignals, getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { workspaceId } = await req.json();
    const wid = workspaceId ?? "00000000-0000-0000-0000-000000000001";

    const workspace = await getWorkspace(wid);
    const config = workspace.integrations_config?.intercom;

    if (!config?.enabled) {
      return NextResponse.json({ error: "Intercom not enabled" }, { status: 400 });
    }
    if (!config.access_token) {
      return NextResponse.json({ error: "Missing Intercom access_token" }, { status: 400 });
    }

    const items = await fetchIntercomConversations(config);
    if (items.length === 0) {
      return NextResponse.json({ ingested: 0, message: "No new conversations since last sync" });
    }

    const signals = items.map((m) => ({
      workspace_id: wid,
      source: "intercom" as const,
      channel: m.channel,
      sender: m.sender,
      content: m.content,
      timestamp: m.timestamp,
      reviewed: false,
    }));

    const inserted = await insertSignals(signals);

    const newConfig = {
      ...workspace.integrations_config,
      intercom: { ...config, last_sync: new Date().toISOString() },
    };
    await getSupabaseAdmin().from("workspaces").update({ integrations_config: newConfig }).eq("id", wid);

    return NextResponse.json({ ingested: inserted?.length ?? 0 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
