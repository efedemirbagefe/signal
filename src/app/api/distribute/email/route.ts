export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { sendEmailBrief } from "@/lib/email";
import { getWorkspace, logDelivery, supabaseAdmin } from "@/lib/supabase";
import type { Cluster } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { workspaceId, clusterIds, recipientsOverride } = await req.json();
  const wid = workspaceId ?? "00000000-0000-0000-0000-000000000001";

  const workspace = await getWorkspace(wid);
  const config = workspace.distribution_config?.email;

  if (!config?.enabled) {
    return NextResponse.json({ error: "Email distribution not enabled" }, { status: 400 });
  }

  // Get clusters
  const ids = clusterIds ?? [];
  const { data: clusters } = ids.length > 0
    ? await supabaseAdmin.from("clusters").select("*").in("id", ids)
    : await supabaseAdmin.from("clusters").select("*").eq("workspace_id", wid).eq("status", "active").order("severity", { ascending: false }).limit(10);

  if (!clusters || clusters.length === 0) {
    return NextResponse.json({ error: "No clusters to send" }, { status: 400 });
  }

  const recipients = recipientsOverride ?? config.recipients ?? [];
  if (recipients.length === 0) {
    return NextResponse.json({ error: "No recipients configured" }, { status: 400 });
  }

  try {
    await sendEmailBrief(recipients, clusters as Cluster[]);

    // Log deliveries for each cluster
    for (const cluster of clusters) {
      await logDelivery({
        cluster_id: cluster.id,
        channel: "email",
        recipient: recipients.join(", "),
        sent_at: new Date().toISOString(),
        status: "sent",
      });
    }

    return NextResponse.json({ delivered: clusters.length, recipients });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
