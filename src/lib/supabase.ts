import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy singletons — created on first use, not at module evaluation time
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _supabaseAdmin;
}

// Named exports kept for compatibility — these are now functions returning the client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string, unknown>)[prop as string];
  },
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as unknown as Record<string, unknown>)[prop as string];
  },
});

// Helper to get workspace by ID
export async function getWorkspace(workspaceId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();
  if (error) throw error;
  return data;
}

// Helper to insert signals in bulk
export async function insertSignals(
  signals: Omit<import("./types").Signal, "id" | "created_at">[]
) {
  const { data, error } = await getSupabaseAdmin()
    .from("signals")
    .insert(signals)
    .select();
  if (error) throw error;
  return data;
}

// Helper to get unanalyzed signals for a workspace
export async function getPendingSignals(workspaceId: string, limit = 500) {
  const { data, error } = await getSupabaseAdmin()
    .from("signals")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("reviewed", false)
    .order("timestamp", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// Helper to upsert clusters
export async function upsertClusters(
  clusters: Omit<import("./types").Cluster, "id" | "created_at" | "updated_at">[]
) {
  const { data, error } = await getSupabaseAdmin()
    .from("clusters")
    .insert(clusters)
    .select();
  if (error) throw error;
  return data;
}

// Helper to log a delivery
export async function logDelivery(delivery: Omit<import("./types").Delivery, "id">) {
  const { data, error } = await getSupabaseAdmin()
    .from("deliveries")
    .insert(delivery)
    .select()
    .single();
  if (error) throw error;
  return data;
}
