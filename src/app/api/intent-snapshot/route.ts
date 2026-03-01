export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { generateIntentSnapshot } from "@/lib/anthropic";
import { supabaseAdmin } from "@/lib/supabase";
import type { Cluster } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { clusterId } = await req.json();

  const { data: cluster } = await supabaseAdmin
    .from("clusters")
    .select("*")
    .eq("id", clusterId)
    .single();

  if (!cluster) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 });
  }

  const snapshot = await generateIntentSnapshot(cluster as Cluster);
  return NextResponse.json({ snapshot, cluster });
}
