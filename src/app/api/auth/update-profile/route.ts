export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedWorkspaceId } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/auth/update-profile
 * Updates the current user's display_name in Supabase auth metadata.
 */
export async function POST(req: NextRequest) {
  let workspaceId: string;
  try {
    workspaceId = await getAuthenticatedWorkspaceId();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { displayName } = await req.json();
  if (typeof displayName !== "string") {
    return NextResponse.json({ error: "displayName must be a string" }, { status: 400 });
  }

  // Look up user_id from workspace
  const supabase = getSupabaseAdmin();
  const { data: ws } = await supabase
    .from("workspaces")
    .select("user_id")
    .eq("id", workspaceId)
    .single();

  if (!ws?.user_id) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const { error } = await supabase.auth.admin.updateUserById(ws.user_id, {
    user_metadata: { display_name: displayName.trim() },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
