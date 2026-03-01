export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { analyzeSignals } from "@/lib/anthropic";
import { getPendingSignals, upsertClusters, supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { workspaceId } = await req.json();
  const wid = workspaceId ?? "00000000-0000-0000-0000-000000000001";

  // Get pending signals
  const signals = await getPendingSignals(wid);

  if (signals.length === 0) {
    return NextResponse.json({ message: "No signals to analyze", clusters: [] });
  }

  // Run Claude analysis
  const results = await analyzeSignals(signals);

  // Map to cluster format
  const clusters = results.map((r) => ({
    workspace_id: wid,
    title: r.title,
    severity: r.severity,
    severity_label: (r.severity >= 70 ? "high" : r.severity >= 40 ? "medium" : "low") as "high" | "medium" | "low",
    confidence: r.confidence,
    evidence_count: r.evidence_count,
    source_breakdown: r.source_breakdown,
    business_case: r.business_case,
    recommended_action: r.recommended_action,
    customer_quote: r.customer_quote,
    status: "active" as const,
  }));

  const inserted = await upsertClusters(clusters);

  // Mark signals as reviewed
  await supabaseAdmin
    .from("signals")
    .update({ reviewed: true })
    .eq("workspace_id", wid)
    .eq("reviewed", false);

  return NextResponse.json({ analyzed: signals.length, clusters: inserted?.length ?? 0, results: inserted });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId") ?? "00000000-0000-0000-0000-000000000001";

  const { data, error } = await supabaseAdmin
    .from("clusters")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("severity", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ clusters: data });
}
