import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "./supabase";

/**
 * Server-side helper for API routes.
 * Uses @supabase/ssr createServerClient to properly read the cookie
 * format written by createBrowserClient (handles chunking, encoding, etc.).
 * Throws if unauthenticated or no workspace found.
 */
export async function getAuthenticatedWorkspaceId(): Promise<string> {
  const cookieStore = await cookies();

  // Use createServerClient which knows how to read the cookie format
  // that createBrowserClient writes (handles chunked cookies, base64, etc.)
  const supabaseUser = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user }, error } = await supabaseUser.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthenticated");
  }

  const supabase = getSupabaseAdmin();
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (wsError || !workspace) {
    throw new Error(`No workspace found for user ${user.id}`);
  }

  return workspace.id;
}
