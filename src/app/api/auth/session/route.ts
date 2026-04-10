export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAuthenticatedWorkspaceId } from "@/lib/auth";

/**
 * GET /api/auth/session
 * Bridge for "use client" pages to retrieve the current workspace ID
 * from the server-side session cookie.
 * Returns { workspaceId } or 401.
 */
export async function GET() {
  try {
    const workspaceId = await getAuthenticatedWorkspaceId();
    return NextResponse.json({ workspaceId });
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
}
