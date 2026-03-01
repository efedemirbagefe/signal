import twilio from "twilio";
import type { Cluster } from "./types";

export function getTwilioClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
}

export async function sendWhatsAppAlert(toNumber: string, cluster: Cluster) {
  const client = getTwilioClient();
  const severityEmoji = cluster.severity >= 70 ? "🔴" : cluster.severity >= 40 ? "🟡" : "🟢";
  const severityLabel = cluster.severity >= 70 ? "HIGH" : cluster.severity >= 40 ? "MEDIUM" : "LOW";

  const body = `${severityEmoji} *Observer AI Alert*
*${cluster.title}*
Severity: ${severityLabel} (${cluster.severity}/100)

${cluster.business_case}

Action: ${cluster.recommended_action}

Evidence: ${cluster.evidence_count} signals
View: ${process.env.NEXTAUTH_URL}/dashboard?gap=${cluster.id}`;

  return client.messages.create({
    body,
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${toNumber}`,
  });
}

export function parseInboundWhatsApp(body: Record<string, string>) {
  return {
    sender: body.From?.replace("whatsapp:", "") ?? "unknown",
    content: body.Body ?? "",
    channel: "whatsapp",
    timestamp: new Date().toISOString(),
  };
}

export function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const client = twilio;
  return client.validateRequest(authToken, signature, url, params);
}
