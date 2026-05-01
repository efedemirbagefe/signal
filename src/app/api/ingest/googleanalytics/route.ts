export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getWorkspace } from "@/lib/supabase";
import { getAuthenticatedWorkspaceId } from "@/lib/auth";

export async function POST(_req: NextRequest) {
  try {
    let wid: string;
    try {
      wid = await getAuthenticatedWorkspaceId();
    } catch {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const workspace = await getWorkspace(wid);
    const config = workspace.integrations_config?.googleanalytics;

    if (!config?.enabled) {
      return NextResponse.json({ error: "Google Analytics not enabled" }, { status: 400 });
    }
    if (!config.property_id || !config.service_account_key) {
      return NextResponse.json(
        { error: "Missing Google Analytics configuration (property_id and service_account_key required)" },
        { status: 400 }
      );
    }

    // TODO: Implement Google Analytics Data API (GA4)
    // 1. Authenticate with service_account_key JSON
    // 2. Call analyticsdata.runReport for config.property_id
    // 3. Filter events by event_filter (comma-sep list) and last_sync date
    // 4. Transform behavioral anomalies into signal objects
    // 5. Insert via insertSignals()
    return NextResponse.json({
      ingested: 0,
      message: "Google Analytics ingestion coming soon — API integration in progress",
    });
  } catch (err) {
    console.error("[ingest/googleanalytics]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
