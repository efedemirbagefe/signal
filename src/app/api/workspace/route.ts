export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("id") ?? "00000000-0000-0000-0000-000000000001";

  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .select("id, name, slack_team_id, slack_monitored_channels, whatsapp_config, distribution_config, integrations_config")
    .eq("id", workspaceId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workspace: data });
}

export async function PATCH(req: NextRequest) {
  const { workspaceId, updates } = await req.json();
  const wid = workspaceId ?? "00000000-0000-0000-0000-000000000001";

  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .update(updates)
    .eq("id", wid)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workspace: data });
}
