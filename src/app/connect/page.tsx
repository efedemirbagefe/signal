"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

function ConnectContent() {
  const searchParams = useSearchParams();
  const initialStep = Number(searchParams.get("step") ?? 1);
  const [step, setStep] = useState(initialStep);
  const [channels, setChannels] = useState<string[]>([]);
  const [channelInput, setChannelInput] = useState("");
  const [distConfig, setDistConfig] = useState({ slackChannel: "", emailRecipient: "", waNumber: "" });
  const [saving, setSaving] = useState(false);

  const steps = [
    { n: 1, label: "Slack", icon: "⚡" },
    { n: 2, label: "Email", icon: "✉️" },
    { n: 3, label: "WhatsApp", icon: "💬" },
    { n: 4, label: "Distribute", icon: "📡" },
  ];

  const addChannel = () => {
    if (channelInput.trim() && !channels.includes(channelInput.trim())) {
      setChannels([...channels, channelInput.trim()]);
      setChannelInput("");
    }
  };

  const saveAndContinue = async () => {
    setSaving(true);
    if (step === 1 && channels.length > 0) {
      await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: WORKSPACE_ID, updates: { slack_monitored_channels: channels } }),
      });
    }
    if (step === 4) {
      const config = {
        slack: { enabled: !!distConfig.slackChannel, channels: distConfig.slackChannel ? [distConfig.slackChannel] : [], severity_threshold: "medium", schedule: "instant" },
        whatsapp: { enabled: !!distConfig.waNumber, recipient_numbers: distConfig.waNumber ? [distConfig.waNumber] : [], critical_only: true },
        email: { enabled: !!distConfig.emailRecipient, recipients: distConfig.emailRecipient ? [distConfig.emailRecipient] : [], schedule: "daily" },
      };
      await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: WORKSPACE_ID, updates: { distribution_config: config } }),
      });
    }
    setSaving(false);
    if (step < 4) setStep(step + 1);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b0c10", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "50%", background: "radial-gradient(ellipse at top left, rgba(110,168,255,0.10) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "50%", background: "radial-gradient(ellipse at top right, rgba(167,139,250,0.08) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div className="brand-dot" />
            <span style={{ color: "white", fontWeight: 700 }}>Observer AI</span>
          </Link>
          <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>/ Connect Sources</span>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 8, marginBottom: 48 }}>
          {steps.map((s) => (
            <div key={s.n} style={{ flex: 1 }}>
              <div
                className={s.n < step ? "step-complete" : s.n === step ? "step-active" : "step-inactive"}
                style={{ borderRadius: 9999, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 600, cursor: s.n < step ? "pointer" : "default" }}
                onClick={() => s.n < step && setStep(s.n)}
              >
                <span>{s.icon}</span>
                <span style={{ display: "none" }}>{s.label}</span>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: s.n <= step ? "var(--accent-green)" : "rgba(255,255,255,0.08)", marginTop: 6, transition: "background 0.3s" }} />
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="obs-card animate-slide-up" style={{ padding: 40 }}>
          {step === 1 && (
            <>
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(232,121,249,0.1)", border: "1px solid rgba(232,121,249,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>⚡</div>
                  <div>
                    <h2 style={{ color: "white", fontWeight: 700, fontSize: "1.25rem", margin: 0 }}>Connect Slack</h2>
                    <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>OAuth connect to your Slack workspace</p>
                  </div>
                </div>
                <a href={`/api/auth/slack?state=${WORKSPACE_ID}`} className="btn-primary" style={{ textDecoration: "none", display: "inline-flex" }}>
                  ⚡ Connect with Slack
                </a>
              </div>

              <div className="divider" />

              <div>
                <h3 style={{ color: "white", fontWeight: 600, marginBottom: 12, fontSize: "0.95rem" }}>
                  Channels to monitor
                </h3>
                <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: 16 }}>
                  Enter channel IDs or names to ingest signals from (e.g. <code style={{ color: "var(--accent-green)", fontSize: "0.8rem" }}>C0123ABCD</code> or <code style={{ color: "var(--accent-green)", fontSize: "0.8rem" }}>general</code>)
                </p>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <input
                    className="obs-input"
                    value={channelInput}
                    onChange={(e) => setChannelInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addChannel()}
                    placeholder="channel-name or C0123ABCD"
                  />
                  <button className="btn-ghost" onClick={addChannel} style={{ whiteSpace: "nowrap" }}>Add</button>
                </div>
                {channels.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {channels.map((ch) => (
                      <div key={ch} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 9999, background: "rgba(70,230,166,0.1)", border: "1px solid rgba(70,230,166,0.25)", fontSize: "0.8rem", color: "var(--accent-green)" }}>
                        # {ch}
                        <button onClick={() => setChannels(channels.filter((c) => c !== ch))} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0, fontSize: "0.9rem" }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(110,168,255,0.1)", border: "1px solid rgba(110,168,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>✉️</div>
                <div>
                  <h2 style={{ color: "white", fontWeight: 700, fontSize: "1.25rem", margin: 0 }}>Connect Email</h2>
                  <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>Gmail OAuth for inbox ingestion</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <a href={`/api/auth/gmail?state=${WORKSPACE_ID}`} className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", width: "fit-content" }}>
                  ✉️ Connect Gmail
                </a>

                <div style={{ padding: 20, borderRadius: 12, background: "rgba(110,168,255,0.06)", border: "1px solid rgba(110,168,255,0.15)" }}>
                  <p style={{ color: "var(--accent-blue)", fontWeight: 600, fontSize: "0.875rem", margin: "0 0 8px" }}>Or use IMAP (optional)</p>
                  <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>
                    Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in your .env.local for IMAP/SMTP access.
                  </p>
                </div>

                <div style={{ padding: 20, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ color: "white", fontWeight: 600, fontSize: "0.875rem", margin: "0 0 8px" }}>What Observer reads</p>
                  <ul style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
                    <li>Subject lines and email bodies from your inbox</li>
                    <li>Sender details for source tracking</li>
                    <li>Timestamps for chronological analysis</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(70,230,166,0.1)", border: "1px solid rgba(70,230,166,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>💬</div>
                <div>
                  <h2 style={{ color: "white", fontWeight: 700, fontSize: "1.25rem", margin: 0 }}>Connect WhatsApp</h2>
                  <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>Twilio webhook for WhatsApp Business</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ padding: 20, borderRadius: 12, background: "rgba(70,230,166,0.06)", border: "1px solid rgba(70,230,166,0.15)" }}>
                  <p style={{ color: "var(--accent-green)", fontWeight: 600, fontSize: "0.875rem", margin: "0 0 12px" }}>Setup Instructions</p>
                  <ol style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0, paddingLeft: 16, lineHeight: 2 }}>
                    <li>Create a Twilio account at twilio.com</li>
                    <li>Enable WhatsApp Sandbox or Business number</li>
                    <li>Set webhook URL to your Observer endpoint:</li>
                  </ol>
                  <div style={{ margin: "12px 0", padding: "10px 16px", borderRadius: 8, background: "#0b0c10", fontFamily: "monospace", fontSize: "0.8rem", color: "var(--accent-green)", border: "1px solid rgba(70,230,166,0.2)" }}>
                    {process.env.NEXTAUTH_URL ?? "https://your-domain.com"}/api/webhooks/whatsapp
                  </div>
                  <ol start={4} style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0, paddingLeft: 16, lineHeight: 2 }}>
                    <li>Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER in .env.local</li>
                    <li>Messages sent to your WhatsApp number will automatically appear as signals</li>
                  </ol>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>📡</div>
                <div>
                  <h2 style={{ color: "white", fontWeight: 700, fontSize: "1.25rem", margin: 0 }}>Configure Distribution</h2>
                  <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>Where should Observer send decision briefs?</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={{ color: "white", fontSize: "0.875rem", fontWeight: 500, display: "block", marginBottom: 8 }}>⚡ Slack channel for briefs</label>
                  <input className="obs-input" value={distConfig.slackChannel} onChange={(e) => setDistConfig({ ...distConfig, slackChannel: e.target.value })} placeholder="#product-intelligence" />
                </div>
                <div>
                  <label style={{ color: "white", fontSize: "0.875rem", fontWeight: 500, display: "block", marginBottom: 8 }}>✉️ Email recipients</label>
                  <input className="obs-input" value={distConfig.emailRecipient} onChange={(e) => setDistConfig({ ...distConfig, emailRecipient: e.target.value })} placeholder="pm@company.com" />
                </div>
                <div>
                  <label style={{ color: "white", fontSize: "0.875rem", fontWeight: 500, display: "block", marginBottom: 8 }}>💬 WhatsApp number for critical alerts</label>
                  <input className="obs-input" value={distConfig.waNumber} onChange={(e) => setDistConfig({ ...distConfig, waNumber: e.target.value })} placeholder="+1234567890" />
                  <p style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: 6 }}>Critical severity gaps only. Format: +[country code][number]</p>
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              className="btn-secondary"
              onClick={() => setStep(Math.max(1, step - 1))}
              style={{ visibility: step > 1 ? "visible" : "hidden" }}
            >
              ← Back
            </button>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-secondary" onClick={() => setStep(step < 4 ? step + 1 : step)}>
                Skip
              </button>
              {step < 4 ? (
                <button className="btn-primary" onClick={saveAndContinue} disabled={saving}>
                  {saving ? "Saving..." : "Continue →"}
                </button>
              ) : (
                <button className="btn-primary" onClick={saveAndContinue} disabled={saving}>
                  {saving ? "Saving..." : (
                    <Link href="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>Go to Dashboard →</Link>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Step label */}
        <div style={{ textAlign: "center", marginTop: 24, color: "var(--muted)", fontSize: "0.875rem" }}>
          Step {step} of 4 — {steps[step - 1]?.label}
        </div>
      </div>
    </div>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0b0c10" }} />}>
      <ConnectContent />
    </Suspense>
  );
}
