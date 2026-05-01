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
    const config = workspace.integrations_config?.googleplay;

    if (!config?.enabled) {
      return NextResponse.json({ error: "Google Play not enabled" }, { status: 400 });
    }
    if (!config.package_name || !config.service_account_key) {
      return NextResponse.json(
        { error: "Missing Google Play configuration (package_name and service_account_key required)" },
        { status: 400 }
      );
    }

    // TODO: Implement Google Play Reviews API via Google APIs
    // 1. Authenticate with service_account_key JSON
    // 2. Call androidpublisher.reviews.list for config.package_name
    // 3. Filter by max_rating and last_sync date
    // 4. Insert normalized signals via insertSignals()
    return NextResponse.json({
      ingested: 0,
      message: "Google Play ingestion coming soon — API integration in progress",
    });
  } catch (err) {
    console.error("[ingest/googleplay]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
