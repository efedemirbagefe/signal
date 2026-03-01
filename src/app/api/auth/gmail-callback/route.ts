export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { exchangeGmailCode } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const workspaceId = searchParams.get("state") ?? "00000000-0000-0000-0000-000000000001";

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/connect?error=gmail_denied`);
  }

  const tokens = await exchangeGmailCode(code);

  if (!tokens.access_token) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/connect?error=gmail_auth_failed`);
  }

  await supabaseAdmin
    .from("workspaces")
    .update({
      gmail_token: tokens.access_token,
      gmail_refresh_token: tokens.refresh_token,
    })
    .eq("id", workspaceId);

  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/connect?step=3&gmail=connected`);
}
