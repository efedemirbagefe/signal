"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { DistributionConfig } from "@/lib/types";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

const defaultConfig: DistributionConfig = {
  slack: { enabled: false, channels: [], severity_threshold: "high", schedule: "instant" },
  whatsapp: { enabled: false, recipient_numbers: [], critical_only: true },
  email: { enabled: false, recipients: [], schedule: "daily" },
};

interface Delivery {
  id: string;
  cluster_id: string;
  channel: string;
  recipient: string;
  sent_at: string;
  status: string;
}

export default function DistributionSettingsPage() {
  const [config, setConfig] = useState<DistributionConfig>(defaultConfig);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [slackChannelInput, setSlackChannelInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [waInput, setWaInput] = useState("");

  useEffect(() => {
    fetch(`/api/workspace?id=${WORKSPACE_ID}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.workspace?.distribution_config) {
          setConfig(d.workspace.distribution_config);
        }
      });
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    await fetch("/api/workspace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: WORKSPACE_ID, updates: { distribution_config: config } }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addSlackChannel = () => {
    if (slackChannelInput.trim()) {
      setConfig({ ...config, slack: { ...config.slack, channels: [...config.slack.channels, slackChannelInput.trim()] } });
      setSlackChannelInput("");
    }
  };

  const addEmail = () => {
    if (emailInput.trim()) {
      setConfig({ ...config, email: { ...config.email, recipients: [...config.email.recipients, emailInput.trim()] } });
      setEmailInput("");
    }
  };

  const addWaNumber = () => {
    if (waInput.trim()) {
      setConfig({ ...config, whatsapp: { ...config.whatsapp, recipient_numbers: [...config.whatsapp.recipient_numbers, waInput.trim()] } });
      setWaInput("");
    }
  };

  const SectionCard = ({ children, title, icon }: { children: React.ReactNode; title: string; icon: string }) => (
    <div className="obs-card" style={{ padding: 28, marginBottom: 20 }}>
      <h3 style={{ color: "white", fontWeight: 600, fontSize: "1rem", display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 44, height: 24, borderRadius: 9999, background: checked ? "var(--accent-green)" : "rgba(255,255,255,0.15)", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
    >
      <div style={{ position: "absolute", top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0b0c10", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "40%", height: "40%", background: "radial-gradient(ellipse at top left, rgba(110,168,255,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: "40%", height: "40%", background: "radial-gradient(ellipse at top right, rgba(167,139,250,0.07) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Top bar */}
        <div style={{ background: "rgba(11,12,16,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "16px 32px", display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div className="brand-dot" />
            <span style={{ color: "white", fontWeight: 700 }}>Observer AI</span>
          </Link>
          <span style={{ color: "var(--muted)" }}>/</span>
          <span style={{ color: "white", fontWeight: 500 }}>Distribution Settings</span>
        </div>

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <h1 style={{ color: "white", fontWeight: 700, fontSize: "1.5rem", margin: "0 0 6px" }}>Distribution Settings</h1>
              <p style={{ color: "var(--muted)", margin: 0 }}>Configure outbound channels for decision briefs and alerts</p>
            </div>
            <button className="btn-primary" onClick={saveConfig} disabled={saving}>
              {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Settings"}
            </button>
          </div>

          {/* Slack */}
          <SectionCard title="Slack Distribution" icon="⚡">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ color: "white", fontWeight: 500, fontSize: "0.875rem" }}>Enable Slack distribution</div>
                <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Post briefs to Slack channels</div>
              </div>
              <Toggle checked={config.slack.enabled} onChange={(v) => setConfig({ ...config, slack: { ...config.slack, enabled: v } })} />
            </div>

            {config.slack.enabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <label style={{ color: "var(--muted)", fontSize: "0.8rem", display: "block", marginBottom: 8 }}>Target channels</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <input className="obs-input" value={slackChannelInput} onChange={(e) => setSlackChannelInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSlackChannel()} placeholder="#product-intelligence" />
                    <button className="btn-ghost" onClick={addSlackChannel}>Add</button>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {config.slack.channels.map((ch) => (
                      <div key={ch} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 9999, background: "rgba(70,230,166,0.1)", border: "1px solid rgba(70,230,166,0.2)", fontSize: "0.8rem", color: "var(--accent-green)" }}>
                        #{ch}
                        <button onClick={() => setConfig({ ...config, slack: { ...config.slack, channels: config.slack.channels.filter((c) => c !== ch) } })} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ color: "var(--muted)", fontSize: "0.8rem", display: "block", marginBottom: 8 }}>Minimum severity</label>
                    <select className="obs-select" style={{ width: "100%" }} value={config.slack.severity_threshold} onChange={(e) => setConfig({ ...config, slack: { ...config.slack, severity_threshold: e.target.value as "high" | "medium" | "low" } })}>
                      <option value="high">High only</option>
                      <option value="medium">Medium & above</option>
                      <option value="low">All gaps</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: "var(--muted)", fontSize: "0.8rem", display: "block", marginBottom: 8 }}>Schedule</label>
                    <select className="obs-select" style={{ width: "100%" }} value={config.slack.schedule} onChange={(e) => setConfig({ ...config, slack: { ...config.slack, schedule: e.target.value as "instant" | "hourly" | "daily" } })}>
                      <option value="instant">Instant</option>
                      <option value="hourly">Hourly digest</option>
                      <option value="daily">Daily digest</option>
                    </select>
                  </div>
                </div>

                {/* Slack Preview */}
                <div>
                  <label style={{ color: "var(--muted)", fontSize: "0.8rem", display: "block", marginBottom: 8 }}>Preview</label>
                  <div className="slack-preview" style={{ padding: "16px 20px" }}>
                    <div style={{ color: "#46e6a6", fontWeight: 700, fontSize: "0.8rem", marginBottom: 6 }}>Observer AI <span style={{ color: "#666", fontWeight: 400, fontSize: "0.7rem" }}>Today at 9:42 AM</span></div>
                    <div style={{ color: "#e0e0e0", fontSize: "0.8rem", lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 700 }}>🔴 Intent Gap · HIGH</div>
                      <div><strong>Missing bulk export functionality</strong></div>
                      <div style={{ color: "#9aa3b2" }}>42 users mentioned inability to export data in bulk across 3 channels. Revenue risk: High.</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      {config.slack.channels.slice(0, 2).map((ch) => (
                        <span key={ch} style={{ fontSize: "0.7rem", color: "#9aa3b2" }}>→ #{ch}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* WhatsApp */}
          <SectionCard title="WhatsApp Alerts" icon="💬">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ color: "white", fontWeight: 500, fontSize: "0.875rem" }}>Enable WhatsApp alerts</div>
                <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Send critical gaps via WhatsApp</div>
              </div>
              <Toggle checked={config.whatsapp.enabled} onChange={(v) => setConfig({ ...config, whatsapp: { ...config.whatsapp, enabled: v } })} />
            </div>

            {config.whatsapp.enabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <label style={{ color: "var(--muted)", fontSize: "0.8rem", display: "block", marginBottom: 8 }}>Recipient numbers</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <input className="obs-input" value={waInput} onChange={(e) => setWaInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addWaNumber()} placeholder="+1234567890" />
                    <button className="btn-ghost" onClick={addWaNumber}>Add</button>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {config.whatsapp.recipient_numbers.map((n) => (
                      <div key={n} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 9999, background: "rgba(70,230,166,0.1)", border: "1px solid rgba(70,230,166,0.2)", fontSize: "0.8rem", color: "var(--accent-green)" }}>
                        {n}
                        <button onClick={() => setConfig({ ...config, whatsapp: { ...config.whatsapp, recipient_numbers: config.whatsapp.recipient_numbers.filter((r) => r !== n) } })} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ color: "white", fontWeight: 500, fontSize: "0.875rem" }}>Critical alerts only</div>
                    <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Only send HIGH severity gaps (70+/100)</div>
                  </div>
                  <Toggle checked={config.whatsapp.critical_only} onChange={(v) => setConfig({ ...config, whatsapp: { ...config.whatsapp, critical_only: v } })} />
                </div>

                {/* WA Preview */}
                <div style={{ padding: 20, borderRadius: 12, background: "#0a1e10", border: "1px solid rgba(70,230,166,0.2)", fontFamily: "monospace", fontSize: "0.8rem" }}>
                  <div style={{ color: "var(--accent-green)", marginBottom: 8, fontWeight: 600 }}>Message Preview</div>
                  <div style={{ color: "#e0e0e0", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                    {`🔴 *Observer AI Alert*\n*Missing bulk export functionality*\nSeverity: HIGH (85/100)\n\n42 users reported inability to export data in bulk.\n\nAction: Build a CSV/JSON export API endpoint\n\nEvidence: 38 signals\nView: https://your-app.com/dashboard?gap=...`}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Email */}
          <SectionCard title="Email Digests" icon="✉️">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ color: "white", fontWeight: 500, fontSize: "0.875rem" }}>Enable email digests</div>
                <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Send gap reports via email</div>
              </div>
              <Toggle checked={config.email.enabled} onChange={(v) => setConfig({ ...config, email: { ...config.email, enabled: v } })} />
            </div>

            {config.email.enabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <label style={{ color: "var(--muted)", fontSize: "0.8rem", display: "block", marginBottom: 8 }}>Recipients</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <input className="obs-input" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addEmail()} placeholder="pm@company.com" />
                    <button className="btn-ghost" onClick={addEmail}>Add</button>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {config.email.recipients.map((r) => (
                      <div key={r} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 9999, background: "rgba(110,168,255,0.1)", border: "1px solid rgba(110,168,255,0.2)", fontSize: "0.8rem", color: "var(--accent-blue)" }}>
                        {r}
                        <button onClick={() => setConfig({ ...config, email: { ...config.email, recipients: config.email.recipients.filter((e) => e !== r) } })} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ color: "var(--muted)", fontSize: "0.8rem", display: "block", marginBottom: 8 }}>Digest schedule</label>
                  <select className="obs-select" value={config.email.schedule} onChange={(e) => setConfig({ ...config, email: { ...config.email, schedule: e.target.value as "instant" | "daily" | "weekly" } })}>
                    <option value="instant">Instant (critical only)</option>
                    <option value="daily">Daily digest</option>
                    <option value="weekly">Weekly summary</option>
                  </select>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Delivery Log */}
          <div className="obs-card" style={{ padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ color: "white", fontWeight: 600, fontSize: "1rem", margin: 0 }}>📋 Delivery Log</h3>
              <button className="btn-secondary" style={{ fontSize: "0.8rem" }} onClick={() => {
                fetch(`/api/signals?workspaceId=${WORKSPACE_ID}`)
                  .then(r => r.json())
                  .then(() => {});
              }}>Refresh</button>
            </div>
            {deliveries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: "0.875rem" }}>
                No deliveries yet. Configure channels above and run analysis to start distributing briefs.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["Channel", "Recipient", "Sent At", "Status"].map((h) => (
                      <th key={h} style={{ color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 12px", textAlign: "left", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d) => (
                    <tr key={d.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px", color: "white", fontSize: "0.875rem" }}>{d.channel}</td>
                      <td style={{ padding: "12px", color: "var(--muted)", fontSize: "0.8rem" }}>{d.recipient}</td>
                      <td style={{ padding: "12px", color: "var(--muted)", fontSize: "0.8rem" }}>{new Date(d.sent_at).toLocaleString()}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ fontSize: "0.75rem", padding: "2px 10px", borderRadius: 9999, background: d.status === "sent" ? "rgba(70,230,166,0.12)" : "rgba(255,92,122,0.12)", color: d.status === "sent" ? "var(--accent-green)" : "var(--danger)" }}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
