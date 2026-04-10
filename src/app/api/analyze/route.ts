export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { analyzeSignals } from "@/lib/anthropic";
import { getPendingSignals, upsertClusters, supabaseAdmin, getWorkspace, logDelivery, incrementAnalysisCount, resetAnalysisCountIfNeeded } from "@/lib/supabase";
import { getAuthenticatedWorkspaceId } from "@/lib/auth";
import { getPlanStatus } from "@/lib/polar";
import { postToSlack } from "@/lib/slack";
import { sendEmailBrief } from "@/lib/email";
import { sendWhatsAppAlert } from "@/lib/whatsapp";
import type { Cluster } from "@/lib/types";

export async function POST(_req: NextRequest) {
  let wid: string;
  try {
    wid = await getAuthenticatedWorkspaceId();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // ─── Plan gate ───────────────────────────────────────────────────────────────
  const workspace = await getWorkspace(wid);
  await resetAnalysisCountIfNeeded(workspace);
  // Re-fetch after potential reset
  const freshWorkspace = await getWorkspace(wid);
  const planStatus = getPlanStatus(freshWorkspace);
  if (!planStatus.allowed) {
    const msg =
      planStatus.reason === "trial_expired"
        ? "Your free trial has ended. Upgrade to Pro to continue."
        : planStatus.reason === "trial_limit"
        ? `You've used all ${10} free trial analyses. Upgrade to Pro for unlimited.`
        : "Your subscription is inactive.";
    return NextResponse.json(
      { error: msg, upgrade: true, upgradeUrl: "/settings/billing" },
      { status: 402 },
    );
  }

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

  // Increment usage counter
  await incrementAnalysisCount(wid);

  // Mark signals as reviewed
  await supabaseAdmin
    .from("signals")
    .update({ reviewed: true })
    .eq("workspace_id", wid)
    .eq("reviewed", false);

  // Auto-distribute if enabled — call libraries directly (not via HTTP, which lacks auth cookies)
  try {
    const distConfig = freshWorkspace.distribution_config;
    if (distConfig?.auto_distribute && inserted && inserted.length > 0) {
      const topCluster = inserted[0] as Cluster;
      const distributes: Promise<unknown>[] = [];

      if (distConfig.slack?.enabled) {
        const token = freshWorkspace.slack_bot_token ?? freshWorkspace.slack_token;
        const channels: string[] = distConfig.slack.channels ?? [];
        if (token && channels.length > 0) {
          for (const channel of channels) {
            distributes.push(
              postToSlack(token, channel, topCluster).then(() =>
                logDelivery({ cluster_id: topCluster.id, channel: "slack", recipient: channel, sent_at: new Date().toISOString(), status: "sent" })
              ).catch(() =>
                logDelivery({ cluster_id: topCluster.id, channel: "slack", recipient: channel, sent_at: new Date().toISOString(), status: "failed" })
              )
            );
          }
        }
      }

      if (distConfig.email?.enabled) {
        const recipients: string[] = distConfig.email.recipients ?? [];
        if (recipients.length > 0) {
          distributes.push(
            sendEmailBrief(recipients, inserted as Cluster[]).then(() => {
              for (const c of inserted!) {
                logDelivery({ cluster_id: c.id, channel: "email", recipient: recipients.join(", "), sent_at: new Date().toISOString(), status: "sent" });
              }
            }).catch(() => {
              for (const c of inserted!) {
                logDelivery({ cluster_id: c.id, channel: "email", recipient: recipients.join(", "), sent_at: new Date().toISOString(), status: "failed" });
              }
            })
          );
        }
      }

      if (distConfig.whatsapp?.enabled) {
        const numbers: string[] = distConfig.whatsapp.recipient_numbers ?? [];
        for (const number of numbers) {
          distributes.push(
            sendWhatsAppAlert(number, topCluster).then(() =>
              logDelivery({ cluster_id: topCluster.id, channel: "whatsapp", recipient: number, sent_at: new Date().toISOString(), status: "sent" })
            ).catch(() =>
              logDelivery({ cluster_id: topCluster.id, channel: "whatsapp", recipient: number, sent_at: new Date().toISOString(), status: "failed" })
            )
          );
        }
      }

      await Promise.allSettled(distributes);
    }
  } catch {
    // Auto-distribute failure must not block the analysis response
  }

  return NextResponse.json({ analyzed: signals.length, clusters: inserted?.length ?? 0, results: inserted });
}

export async function GET(_req: NextRequest) {
  let workspaceId: string;
  try {
    workspaceId = await getAuthenticatedWorkspaceId();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("clusters")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("severity", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ clusters: data });
}
