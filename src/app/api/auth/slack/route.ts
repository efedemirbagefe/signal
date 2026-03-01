import { NextResponse } from "next/server";

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    redirect_uri: process.env.SLACK_REDIRECT_URI!,
    scope: "channels:history,channels:read,groups:history,groups:read,users:read,chat:write",
    user_scope: "",
  });
  return NextResponse.redirect(`https://slack.com/oauth/v2/authorize?${params}`);
}
