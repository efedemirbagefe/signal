export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { postToSlack } from "@/lib/slack";
import { getWorkspace, logDelivery, supabaseAdmin } from "@/lib/supabase";
import type { Cluster } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { workspaceId, clusterId, channelOverride } = await req.json();
  const wid = workspaceId ?? "00000000-0000-0000-0000-000000000001";

  const workspace = await getWorkspace(wid);
  if (!workspace.slack_bot_token && !workspace.slack_token) {
    return NextResponse.json({ error: "Slack not connected" }, { status: 400 });
  }

  const token = workspace.slack_bot_token ?? workspace.slack_token;
  const config = workspace.distribution_config?.slack;

  // Get cluster
  const { data: cluster } = await supabaseAdmin
    .from("clusters")
    .select("*")
    .eq("id", clusterId)
    .single();

  if (!cluster) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 });
  }

  // Determine target channels
  const channels: string[] = channelOverride ? [channelOverride] : (config?.channels ?? []);

  if (channels.length === 0) {
    return NextResponse.json({ error: "No distribution channels configured" }, { status: 400 });
  }

  // Apply severity threshold filter
  if (config?.severity_threshold) {
    const thresholds = { high: 70, medium: 40, low: 0 };
    const minSeverity = thresholds[config.severity_threshold as keyof typeof thresholds];
    if ((cluster as Cluster).severity < minSeverity) {
      return NextResponse.json({ skipped: true, reason: "Below severity threshold" });
    }
  }

  const deliveries = [];
  for (const channel of channels) {
    try {
      await postToSlack(token, channel, cluster as Cluster);
      const delivery = await logDelivery({
        cluster_id: clusterId,
        channel: "slack",
        recipient: channel,
        sent_at: new Date().toISOString(),
        status: "sent",
      });
      deliveries.push(delivery);
    } catch (err) {
      const error = err as Error;
      await logDelivery({
        cluster_id: clusterId,
        channel: "slack",
        recipient: channel,
        sent_at: new Date().toISOString(),
        status: "failed",
        response: error.message,
      });
    }
  }

  return NextResponse.json({ delivered: deliveries.length, channels });
}
