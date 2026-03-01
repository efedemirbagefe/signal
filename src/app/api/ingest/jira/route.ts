export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { fetchJiraIssues, fetchJiraCurrentSprint } from "@/lib/jira";
import { getWorkspace, insertSignals, getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const wid = searchParams.get("workspaceId") ?? "00000000-0000-0000-0000-000000000001";

    if (type === "sprint") {
      const workspace = await getWorkspace(wid);
      const config = workspace.integrations_config?.jira;
      if (!config?.enabled || !config.domain) {
        return NextResponse.json({ sprintItems: [] });
      }
      const sprintItems = await fetchJiraCurrentSprint(config);
      return NextResponse.json({ sprintItems });
    }

    return NextResponse.json({ error: "Use POST to ingest issues" }, { status: 405 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspaceId } = await req.json();
    const wid = workspaceId ?? "00000000-0000-0000-0000-000000000001";

    const workspace = await getWorkspace(wid);
    const config = workspace.integrations_config?.jira;

    if (!config?.enabled) {
      return NextResponse.json({ error: "Jira not enabled" }, { status: 400 });
    }
    if (!config.domain || !config.email || !config.api_token || !config.project_key) {
      return NextResponse.json({ error: "Missing Jira configuration (domain, email, api_token, project_key required)" }, { status: 400 });
    }

    const items = await fetchJiraIssues(config);
    if (items.length === 0) {
      return NextResponse.json({ ingested: 0, message: "No new issues since last sync" });
    }

    const signals = items.map((m) => ({
      workspace_id: wid,
      source: "jira" as const,
      channel: m.channel,
      sender: m.sender,
      content: m.content,
      timestamp: m.timestamp,
      reviewed: false,
    }));

    const inserted = await insertSignals(signals);

    const newConfig = {
      ...workspace.integrations_config,
      jira: { ...config, last_sync: new Date().toISOString() },
    };
    await getSupabaseAdmin().from("workspaces").update({ integrations_config: newConfig }).eq("id", wid);

    return NextResponse.json({ ingested: inserted?.length ?? 0 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
