export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId") ?? "00000000-0000-0000-0000-000000000001";
  const source = searchParams.get("source");
  const limit = Number(searchParams.get("limit") ?? 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  let query = supabaseAdmin
    .from("signals")
    .select("*", { count: "exact" })
    .eq("workspace_id", workspaceId)
    .order("timestamp", { ascending: false })
    .range(offset, offset + limit - 1);

  if (source) query = query.eq("source", source);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ signals: data, total: count });
}

export async function PATCH(req: NextRequest) {
  const { signalId } = await req.json();

  const { error } = await supabaseAdmin
    .from("signals")
    .update({ reviewed: true })
    .eq("id", signalId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: true });
}
