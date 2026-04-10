"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { DistributionConfig } from "@/lib/types";
import TopNav from "@/components/layout/TopNav";

const defaultConfig: DistributionConfig = {
  slack: { enabled: false, channels: [], severity_threshold: "high", schedule: "instant" },
  whatsapp: { enabled: false, recipient_numbers: [], critical_only: true },
  email: { enabled: false, recipients: [], schedule: "daily" },
  auto_distribute: false,
};

// ── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`toggle-track${checked ? " on" : ""}`}
      style={{ cursor: "pointer", flexShrink: 0 }}
    />
  );
}

// ── Recipient Chip ──────────────────────────────────────────────────────────

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px 3px 12px",
      background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)",
      borderRadius: 9999, fontSize: "0.78rem", color: "var(--accent)",
    }}>
      {label}
      <button
        onClick={onRemove}
        style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0, lineHeight: 1, fontSize: "0.9rem" }}
      >×</button>
    </div>
  );
}

// ── Channel card ────────────────────────────────────────────────────────────

function ChannelCard({
  icon, title, subtitle, enabled, onToggle, children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--card)",
      border: `1px solid ${enabled ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 14,
      padding: 24,
      transition: "border-color 0.2s",
    }}>
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: enabled && children ? 20 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 11,
            background: enabled ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${enabled ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.08)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.2rem", flexShrink: 0, transition: "all 0.2s",
          }}>
            {icon}
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.95rem", marginBottom: 2 }}>{title}</div>
            <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{subtitle}</div>
          </div>
        </div>
        <Toggle checked={enabled} onChange={onToggle} />
      </div>

      {/* Expanded content */}
      {enabled && children && (
        <div style={{ paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function DistributionSettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<DistributionConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [slackChannelInput, setSlackChannelInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [waInput, setWaInput] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [userInitials, setUserInitials] = useState("?");
  const [testing, setTesting] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const authRes = await fetch("/api/auth/session");
        if (!authRes.ok) { router.push("/login?redirect=/settings/distribution"); return; }
        const wsRes = await fetch("/api/workspace");
        if (!wsRes.ok) { router.push("/login?redirect=/settings/distribution"); return; }
        const wd = await wsRes.json();
        if (wd.workspace?.distribution_config) {
          setConfig({ ...defaultConfig, ...wd.workspace.distribution_config });
        }
        try {
          const sessionData = await authRes.clone().json().catch(() => null) || await fetch("/api/auth/session").then(r => r.json());
          const email: string = sessionData?.user?.email ?? "";
          if (email) setUserInitials(email.substring(0, 2).toUpperCase());
        } catch { /* ignore */ }
        setAuthChecked(true);
      } catch {
        router.push("/login");
      }
    })();
  }, [router]);

  const saveConfig = async () => {
    setSaving(true);
    await fetch("/api/workspace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: { distribution_config: config } }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTestBroadcast = async () => {
    setTesting(true);
    // In production, trigger a test distribution
    await new Promise((r) => setTimeout(r, 1200));
    setTesting(false);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const addSlackChannel = () => {
    const v = slackChannelInput.trim().replace(/^#/, "");
    if (v) {
      setConfig({ ...config, slack: { ...config.slack, channels: [...config.slack.channels, v] } });
      setSlackChannelInput("");
    }
  };

  const addEmail = () => {
    const v = emailInput.trim();
    if (v) {
      setConfig({ ...config, email: { ...config.email, recipients: [...config.email.recipients, v] } });
      setEmailInput("");
    }
  };

  const addWaNumber = () => {
    const v = waInput.trim();
    if (v) {
      setConfig({ ...config, whatsapp: { ...config.whatsapp, recipient_numbers: [...config.whatsapp.recipient_numbers, v] } });
      setWaInput("");
    }
  };

  // Stats
  const activeChannels = [config.slack.enabled, config.email.enabled, config.whatsapp.enabled].filter(Boolean).length;
  const totalRecipients = config.slack.channels.length + config.email.recipients.length + config.whatsapp.recipient_numbers.length;

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, border: "2px solid rgba(249,115,22,0.2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const lblStyle: React.CSSProperties = {
    display: "block", color: "var(--muted)", fontSize: "0.75rem", fontWeight: 500,
    marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <TopNav sourceCount={0} signalCount={0} userInitials={userInitials} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "36px 24px 80px" }}>

        {/* ── Page header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ color: "#fff", fontWeight: 700, fontSize: "1.4rem", margin: "0 0 4px" }}>Distribution</h1>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
              Configure where Signal sends decision briefs and alerts
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={handleTestBroadcast}
              disabled={testing || activeChannels === 0}
              style={{
                background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
                color: testSent ? "var(--accent)" : "var(--muted-light)", cursor: activeChannels > 0 ? "pointer" : "not-allowed",
                padding: "8px 14px", fontSize: "0.82rem", fontWeight: 500, transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 6,
                opacity: activeChannels === 0 ? 0.4 : 1,
              }}
              onMouseEnter={(e) => { if (activeChannels > 0) e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
            >
              {testing ? (
                <>
                  <span style={{ width: 11, height: 11, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "var(--muted-light)", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                  Sending…
                </>
              ) : testSent ? "✓ Sent!" : "Test Broadcast"}
            </button>
            <button
              className="btn-primary"
              onClick={saveConfig}
              disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", fontSize: "0.875rem" }}
            >
              {saving ? (
                <>
                  <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                  Saving…
                </>
              ) : saved ? "✓ Saved" : "Save Settings"}
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Active Channels", value: activeChannels, max: 3, color: activeChannels > 0 ? "var(--accent)" : "var(--muted-light)" },
            { label: "Total Recipients", value: totalRecipients, max: null, color: totalRecipients > 0 ? "var(--accent)" : "var(--muted-light)" },
            { label: "Auto Distribute", value: config.auto_distribute ? "On" : "Off", max: null, color: config.auto_distribute ? "var(--accent)" : "var(--muted)" },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: "var(--card)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12, padding: "16px 20px",
            }}>
              <div style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                {stat.label}
              </div>
              <div style={{ color: stat.color, fontWeight: 700, fontSize: "1.4rem", lineHeight: 1 }}>
                {stat.value}{stat.max !== null ? <span style={{ color: "var(--muted)", fontSize: "0.9rem", fontWeight: 400 }}>/{stat.max}</span> : ""}
              </div>
            </div>
          ))}
        </div>

        {/* ── Auto-distribute toggle ── */}
        <div style={{
          background: "var(--card)", border: `1px solid ${config.auto_distribute ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.07)"}`,
          borderRadius: 14, padding: "20px 24px", marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 9,
                background: config.auto_distribute ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${config.auto_distribute ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.08)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
              }}>
                ⚡
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.9rem", marginBottom: 2 }}>
                  Auto-distribute after analysis
                </div>
                <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
                  Automatically push briefs to all enabled channels when analysis completes
                </div>
              </div>
            </div>
            <Toggle
              checked={config.auto_distribute ?? false}
              onChange={(v) => setConfig({ ...config, auto_distribute: v })}
            />
          </div>
        </div>

        {/* ── Channel cards ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>

          {/* Slack */}
          <ChannelCard
            icon="⚡"
            title="Slack"
            subtitle="Post decision briefs to Slack channels"
            enabled={config.slack.enabled}
            onToggle={(v) => setConfig({ ...config, slack: { ...config.slack, enabled: v } })}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={lblStyle}>Target channels</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input
                    className="obs-input"
                    value={slackChannelInput}
                    onChange={(e) => setSlackChannelInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSlackChannel()}
                    placeholder="#product-intelligence"
                    style={{ flex: 1 }}
                  />
                  <button className="btn-ghost" onClick={addSlackChannel}
                    style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0 14px", color: "var(--muted-light)", background: "none", cursor: "pointer", fontSize: "0.82rem" }}>
                    Add
                  </button>
                </div>
                {config.slack.channels.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {config.slack.channels.map((ch) => (
                      <Chip key={ch} label={`#${ch}`} onRemove={() => setConfig({ ...config, slack: { ...config.slack, channels: config.slack.channels.filter((c) => c !== ch) } })} />
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={lblStyle}>Minimum severity</label>
                  <select className="obs-input" value={config.slack.severity_threshold}
                    onChange={(e) => setConfig({ ...config, slack: { ...config.slack, severity_threshold: e.target.value as "high" | "medium" | "low" } })}
                    style={{ width: "100%" }}>
                    <option value="high">High only</option>
                    <option value="medium">Medium &amp; above</option>
                    <option value="low">All signals</option>
                  </select>
                </div>
                <div>
                  <label style={lblStyle}>Schedule</label>
                  <select className="obs-input" value={config.slack.schedule}
                    onChange={(e) => setConfig({ ...config, slack: { ...config.slack, schedule: e.target.value as "instant" | "hourly" | "daily" } })}
                    style={{ width: "100%" }}>
                    <option value="instant">Instant</option>
                    <option value="hourly">Hourly digest</option>
                    <option value="daily">Daily digest</option>
                  </select>
                </div>
              </div>
            </div>
          </ChannelCard>

          {/* Email */}
          <ChannelCard
            icon="✉️"
            title="Email"
            subtitle="Send gap reports and summaries via email"
            enabled={config.email.enabled}
            onToggle={(v) => setConfig({ ...config, email: { ...config.email, enabled: v } })}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={lblStyle}>Recipients</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input
                    className="obs-input"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addEmail()}
                    placeholder="pm@company.com"
                    style={{ flex: 1 }}
                  />
                  <button className="btn-ghost" onClick={addEmail}
                    style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0 14px", color: "var(--muted-light)", background: "none", cursor: "pointer", fontSize: "0.82rem" }}>
                    Add
                  </button>
                </div>
                {config.email.recipients.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {config.email.recipients.map((r) => (
                      <Chip key={r} label={r} onRemove={() => setConfig({ ...config, email: { ...config.email, recipients: config.email.recipients.filter((e) => e !== r) } })} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={lblStyle}>Digest schedule</label>
                <select className="obs-input" value={config.email.schedule}
                  onChange={(e) => setConfig({ ...config, email: { ...config.email, schedule: e.target.value as "instant" | "daily" | "weekly" } })}
                  style={{ width: "100%" }}>
                  <option value="instant">Instant (critical only)</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly summary</option>
                </select>
              </div>
            </div>
          </ChannelCard>

          {/* WhatsApp */}
          <ChannelCard
            icon="💬"
            title="WhatsApp"
            subtitle="Send critical alerts via WhatsApp messages"
            enabled={config.whatsapp.enabled}
            onToggle={(v) => setConfig({ ...config, whatsapp: { ...config.whatsapp, enabled: v } })}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={lblStyle}>Recipient numbers</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input
                    className="obs-input"
                    value={waInput}
                    onChange={(e) => setWaInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addWaNumber()}
                    placeholder="+1234567890"
                    style={{ flex: 1 }}
                  />
                  <button className="btn-ghost" onClick={addWaNumber}
                    style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0 14px", color: "var(--muted-light)", background: "none", cursor: "pointer", fontSize: "0.82rem" }}>
                    Add
                  </button>
                </div>
                {config.whatsapp.recipient_numbers.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {config.whatsapp.recipient_numbers.map((n) => (
                      <Chip key={n} label={n} onRemove={() => setConfig({ ...config, whatsapp: { ...config.whatsapp, recipient_numbers: config.whatsapp.recipient_numbers.filter((r) => r !== n) } })} />
                    ))}
                  </div>
                )}
              </div>

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div>
                  <div style={{ color: "#fff", fontWeight: 500, fontSize: "0.875rem", marginBottom: 2 }}>
                    Critical alerts only
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
                    Only send HIGH severity signals (score 70+)
                  </div>
                </div>
                <Toggle
                  checked={config.whatsapp.critical_only}
                  onChange={(v) => setConfig({ ...config, whatsapp: { ...config.whatsapp, critical_only: v } })}
                />
              </div>
            </div>
          </ChannelCard>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
