export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { parseInboundWhatsApp } from "@/lib/whatsapp";
import { supabaseAdmin } from "@/lib/supabase";

// Twilio webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get("hub.challenge");
  return new NextResponse(challenge ?? "ok", { status: 200 });
}

export async function POST(req: NextRequest) {
  // Parse form-encoded Twilio webhook payload
  const text = await req.text();
  const params = Object.fromEntries(new URLSearchParams(text));

  const workspaceId = "00000000-0000-0000-0000-000000000001";

  const signal = parseInboundWhatsApp(params);

  await supabaseAdmin.from("signals").insert({
    workspace_id: workspaceId,
    source: "whatsapp",
    channel: "whatsapp",
    sender: signal.sender,
    content: signal.content,
    timestamp: signal.timestamp,
    reviewed: false,
  });

  // Respond with empty TwiML (Twilio expects XML 200)
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
