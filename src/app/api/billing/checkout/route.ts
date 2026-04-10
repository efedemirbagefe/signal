export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { Checkout } from "@polar-sh/nextjs";
import { getAuthenticatedWorkspaceId } from "@/lib/auth";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Build the SDK checkout handler once (reads products/metadata/customerEmail from query params)
const checkoutHandler = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  successUrl:
    process.env.POLAR_SUCCESS_URL ??
    `${process.env.NEXTAUTH_URL}/settings/billing?success=true`,
  server: "production",
});

export async function GET(req: NextRequest) {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  // Auth-gate: must be a signed-in user with a workspace
  let wid: string;
  try {
    wid = await getAuthenticatedWorkspaceId();
  } catch {
    return NextResponse.redirect(new URL("/login", base));
  }

  // Try to pre-fill the Polar checkout form with the user's email
  let email: string | undefined;
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    email = user?.email ?? undefined;
  } catch {
    // Non-fatal — proceed without email
  }

  // Inject server-side params into the request URL so the SDK handler
  // picks them up (it reads ?products=, ?metadata=, ?customerEmail=)
  const url = new URL(req.url);
  url.searchParams.set("products", process.env.POLAR_PRODUCT_ID!);
  url.searchParams.set("metadata", JSON.stringify({ workspace_id: wid }));
  if (email) url.searchParams.set("customerEmail", email);

  const syntheticReq = new NextRequest(url, { headers: req.headers });
  return checkoutHandler(syntheticReq);
}
