"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import type { IntegrationsConfig } from "@/lib/types";
import TopNav from "@/components/layout/TopNav";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Workspace {
  id: string;
  slack_token?: string;
  slack_bot_token?: string;
  slack_monitored_channels?: string[];
  gmail_token?: string;
  integrations_config?: IntegrationsConfig;
  distribution_config?: {
    slack?: { enabled: boolean; channels: string[]; severity_threshold: string; schedule: string };
    email?: { enabled: boolean; recipients: string[]; schedule: string };
    whatsapp?: { enabled: boolean; recipient_numbers: string[]; critical_only: boolean };
    auto_distribute?: boolean;
  };
}

type SourceKey = "slack" | "email" | "zendesk" | "intercom" | "jira" | "appstore" | "github" | "reddit";

// ── Defaults ──────────────────────────────────────────────────────────────────

const defaultIntegrations: IntegrationsConfig = {
  slack:    { enabled: false, max_age_days: 7, keyword_filter: "", last_sync: null },
  email:    { enabled: false, max_age_days: 7, sender_domains: "", last_sync: null },
  zendesk:  { enabled: false, subdomain: "", email: "", api_token: "", min_priority: "normal", exclude_closed: true, last_sync: null },
  intercom: { enabled: false, access_token: "", open_only: true, last_sync: null },
  jira:     { enabled: false, domain: "", email: "", api_token: "", project_key: "", min_priority: "medium", exclude_done: true, issue_types: "", last_sync: null },
  appstore: { enabled: false, app_id_ios: "", app_id_android: "", max_rating: 3, last_sync: null },
  github:   { enabled: false, token: "", owner: "", repo: "", min_reactions: 0, labels: "", last_sync: null },
  reddit:   { enabled: false, client_id: "", client_secret: "", subreddits: "", min_score: 10, min_comments: 0, last_sync: null },
};

// ── Source metadata ────────────────────────────────────────────────────────────

const SOURCES: Array<{ key: SourceKey; label: string; icon: string; category: string; tagline: string }> = [
  { key: "slack",    label: "Slack",      icon: "⚡", category: "Customer Voice", tagline: "Catch what your team is hearing from customers, in real-time" },
  { key: "email",    label: "Email",      icon: "✉️", category: "Customer Voice", tagline: "Turn your inbox into a live customer feedback stream" },
  { key: "zendesk",  label: "Zendesk",    icon: "🎫", category: "Customer Voice", tagline: "Surface the support tickets that reveal what your product is missing" },
  { key: "intercom", label: "Intercom",   icon: "💼", category: "Customer Voice", tagline: "See exactly what customers are asking your team right now" },
  { key: "appstore", label: "App Store",  icon: "⭐", category: "Public Signals", tagline: "Know when users are frustrated before they churn" },
  { key: "reddit",   label: "Reddit",     icon: "👾", category: "Public Signals", tagline: "Find community discussions getting traction about your product" },
  { key: "github",   label: "GitHub",     icon: "🐙", category: "Engineering",    tagline: "Capture every developer-reported bug and feature request" },
  { key: "jira",     label: "Jira",       icon: "📋", category: "Engineering",    tagline: "Track the bugs and features your engineers have validated as real" },
];

const GROUPS: Array<{ label: string; keys: SourceKey[] }> = [
  { label: "Customer Voice", keys: ["slack", "email", "zendesk", "intercom"] },
  { label: "Public Signals", keys: ["appstore", "reddit"] },
  { label: "Engineering",    keys: ["github", "jira"] },
];

const COMING_SOON = [
  { label: "Google Analytics", icon: "📊", category: "Analytics" },
  { label: "Amplitude",        icon: "📈", category: "Analytics" },
  { label: "Sentry",           icon: "🚨", category: "Engineering" },
  { label: "Linear",           icon: "🔷", category: "Engineering" },
  { label: "Help Scout",       icon: "🛟", category: "Support" },
  { label: "PagerDuty",        icon: "🔔", category: "Ops" },
];

// ── Mock preview signals — shown before connecting ─────────────────────────────
// Realistic, specific examples that make the value immediately obvious.

type Sev = "low" | "medium" | "high";

const PREVIEW_SIGNALS: Record<SourceKey, Array<{ title: string; source: string; sev: Sev; ago: string; evidenceLabel: string }>> = {
  slack: [
    { title: "Users keep asking about CSV export — came up 4 separate times this week", source: "#product-feedback", sev: "medium", ago: "2h ago", evidenceLabel: "8 mentions" },
    { title: "Mobile onboarding drops people at step 3, heard it from 2 customers today", source: "#customer-success", sev: "high", ago: "5h ago", evidenceLabel: "3 reports" },
  ],
  email: [
    { title: "Feature request — bulk user management for our 200-person team", source: "john@enterprise.io", sev: "medium", ago: "Yesterday", evidenceLabel: "6 emails" },
    { title: "Salesforce connector is a hard blocker for us to upgrade", source: "cto@bigcorp.com", sev: "high", ago: "2d ago", evidenceLabel: "4 threads" },
  ],
  zendesk: [
    { title: "Salesforce integration has been down for 2 days — blocking our whole team", source: "Ticket #4821 · HIGH", sev: "high", ago: "3h ago", evidenceLabel: "12 tickets" },
    { title: "Can't export our data — compliance audit is due Friday", source: "Ticket #4756 · URGENT", sev: "high", ago: "1h ago", evidenceLabel: "5 tickets" },
  ],
  intercom: [
    { title: "Is there a way to export all our data at once? Tried but couldn't find it", source: "Live chat", sev: "medium", ago: "Just now", evidenceLabel: "14 chats" },
    { title: "How do I bulk-invite teammates? We have 200 people to onboard", source: "Live chat", sev: "medium", ago: "12min ago", evidenceLabel: "9 chats" },
  ],
  jira: [
    { title: "[Mobile] Dashboard charts fail to load on iOS 17.2", source: "BUG-492 · HIGH", sev: "high", ago: "2d ago", evidenceLabel: "7 issues" },
    { title: "API rate limiting causes silent failures for enterprise customers", source: "BUG-488 · HIGH", sev: "high", ago: "4d ago", evidenceLabel: "11 issues" },
  ],
  appstore: [
    { title: "Crashes every time I try to export a PDF — completely unusable", source: "iOS App Store · 2/5 ★", sev: "high", ago: "1h ago", evidenceLabel: "23 reviews" },
    { title: "Lost all my work after the last update. This is unacceptable", source: "iOS App Store · 1/5 ★", sev: "high", ago: "3h ago", evidenceLabel: "16 reviews" },
  ],
  github: [
    { title: "Add webhook retry support when delivery fails", source: "Issue #234 · 👍 12", sev: "medium", ago: "2d ago", evidenceLabel: "8 issues" },
    { title: "Support multiple OAuth providers — Google, GitHub, and SSO", source: "Issue #198 · 👍 27", sev: "medium", ago: "1w ago", evidenceLabel: "15 issues" },
  ],
  reddit: [
    { title: "Why doesn't this product have a Zapier integration? Been asking for 6 months", source: "r/saas · 47 upvotes", sev: "medium", ago: "4h ago", evidenceLabel: "3 threads" },
    { title: "Switched away because there's no mobile app — great product otherwise", source: "r/productivity · 31 upvotes", sev: "medium", ago: "1d ago", evidenceLabel: "5 posts" },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function isConnected(key: SourceKey, workspace: Workspace | null): boolean {
  if (!workspace) return false;
  if (key === "slack") return !!workspace.slack_token;
  if (key === "email") return !!workspace.gmail_token;
  return !!(workspace.integrations_config?.[key as keyof IntegrationsConfig] as { enabled?: boolean })?.enabled;
}

function countConnected(workspace: Workspace | null): number {
  if (!workspace) return 0;
  return SOURCES.filter((s) => isConnected(s.key, workspace)).length;
}

const lblStyle: React.CSSProperties = {
  display: "block", color: "var(--muted)", fontSize: "0.75rem", fontWeight: 500,
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
};
const hintStyle: React.CSSProperties = { color: "var(--muted)", fontSize: "0.72rem", marginTop: 6, lineHeight: 1.4 };

// ── Preview signal card — shows before connecting ──────────────────────────────
// Mirrors the real dashboard SignalCard design so users see exactly what to expect.

const SEV_COLOR: Record<Sev, string> = { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" };
const SEV_LABEL: Record<Sev, string> = { low: "LOW", medium: "MEDIUM", high: "HIGH" };

function PreviewSignalCard({ title, source, sev, ago, evidenceLabel }: {
  title: string; source: string; sev: Sev; ago: string; evidenceLabel: string;
}) {
  const color = SEV_COLOR[sev];
  return (
    <div style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderLeft: `2px solid ${color}`,
      borderRadius: 10,
      padding: "14px 16px 12px 18px",
      position: "relative",
    }}>
      {/* EXAMPLE watermark */}
      <span style={{
        position: "absolute", top: 9, right: 10,
        fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "var(--muted-dim)",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        padding: "1px 6px", borderRadius: 4,
        fontFamily: "var(--font-mono)",
      }}>
        example
      </span>

      {/* Title */}
      <p style={{
        margin: "0 0 9px", fontWeight: 700, fontSize: "0.88rem",
        lineHeight: 1.45, color: "#fff", letterSpacing: "-0.015em",
        paddingRight: 62,
      }}>
        {title}
      </p>

      {/* Source chip */}
      <div style={{ marginBottom: 9 }}>
        <span style={{
          padding: "2px 7px", borderRadius: 4,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: "0.62rem", fontWeight: 600, color: "var(--muted)",
          fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em",
        }}>
          {source}
        </span>
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{
          padding: "1px 7px", borderRadius: 4,
          background: `${color}18`, border: `1px solid ${color}40`,
          fontSize: "0.6rem", fontWeight: 700, color, letterSpacing: "0.06em",
        }}>
          {SEV_LABEL[sev]}
        </span>
        <span style={{ fontSize: "0.67rem", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
          {evidenceLabel}
        </span>
        <span style={{ fontSize: "0.67rem", color: "var(--muted)", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>
          {ago}
        </span>
      </div>

      {/* Confidence bar */}
      <div style={{ height: 2, borderRadius: 1, background: "rgba(255,255,255,0.05)" }}>
        <div style={{ width: "72%", height: "100%", background: color, opacity: 0.45, borderRadius: 1 }} />
      </div>
    </div>
  );
}

// ── Labeled section divider ────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0 20px" }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span style={{
        fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase", color: "var(--muted-dim)",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

// ── Per-source form components ─────────────────────────────────────────────────

function SlackForm({ workspaceId, config, channels, onChannelsChange, onChange }: {
  workspaceId: string;
  config: IntegrationsConfig["slack"];
  channels: string[];
  onChannelsChange: (ch: string[]) => void;
  onChange: (field: string, value: string | number | boolean) => void;
}) {
  const [chInput, setChInput] = useState("");
  const add = () => {
    const v = chInput.trim();
    if (v && !channels.includes(v)) { onChannelsChange([...channels, v]); setChInput(""); }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <a href={`/api/auth/slack?state=${workspaceId}`} className="btn-primary"
        style={{ textDecoration: "none", display: "inline-flex", width: "fit-content" }}>
        ⚡ Connect with Slack
      </a>
      <div>
        <label style={lblStyle}>Channels to monitor</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input className="obs-input" value={chInput} onChange={(e) => setChInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()} placeholder="general or C0123ABCD" style={{ flex: 1 }} />
          <button className="btn-ghost" onClick={add} style={{ whiteSpace: "nowrap" }}>Add</button>
        </div>
        {channels.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {channels.map((ch) => (
              <div key={ch} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 9999, background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", fontSize: "0.78rem", color: "var(--accent)" }}>
                # {ch}
                <button onClick={() => onChannelsChange(channels.filter((c) => c !== ch))}
                  style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lblStyle}>Days back to look</label>
          <input className="obs-input" type="number" min={1} max={90} value={config.max_age_days}
            onChange={(e) => onChange("max_age_days", Number(e.target.value))} />
          <p style={hintStyle}>Only pull messages from the last N days</p>
        </div>
        <div>
          <label style={lblStyle}>Keyword filter <span style={{ textTransform: "none", fontSize: "0.7rem" }}>(optional)</span></label>
          <input className="obs-input" value={config.keyword_filter} placeholder="bug, crash, can't find"
            onChange={(e) => onChange("keyword_filter", e.target.value)} />
          <p style={hintStyle}>Empty = capture all messages</p>
        </div>
      </div>
    </div>
  );
}

function EmailForm({ workspaceId, config, onChange }: {
  workspaceId: string;
  config: IntegrationsConfig["email"];
  onChange: (field: string, value: string | number | boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <a href={`/api/auth/gmail?state=${workspaceId}`} className="btn-primary"
        style={{ textDecoration: "none", display: "inline-flex", width: "fit-content" }}>
        ✉️ Connect Gmail
      </a>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lblStyle}>Days back to look</label>
          <input className="obs-input" type="number" min={1} max={90} value={config.max_age_days}
            onChange={(e) => onChange("max_age_days", Number(e.target.value))} />
          <p style={hintStyle}>Only pull emails from the last N days</p>
        </div>
        <div>
          <label style={lblStyle}>Sender domains <span style={{ textTransform: "none", fontSize: "0.7rem" }}>(optional)</span></label>
          <input className="obs-input" value={config.sender_domains} placeholder="acmecorp.com, partner.io"
            onChange={(e) => onChange("sender_domains", e.target.value)} />
          <p style={hintStyle}>Empty = capture emails from anyone</p>
        </div>
      </div>
    </div>
  );
}

function ZendeskForm({ config, onChange }: {
  config: IntegrationsConfig["zendesk"];
  onChange: (field: string, value: string | number | boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lblStyle}>Subdomain</label>
          <input className="obs-input" placeholder="yourcompany" value={config.subdomain}
            onChange={(e) => onChange("subdomain", e.target.value)} />
        </div>
        <div>
          <label style={lblStyle}>Email</label>
          <input className="obs-input" placeholder="admin@yourcompany.com" value={config.email}
            onChange={(e) => onChange("email", e.target.value)} />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={lblStyle}>API Token</label>
          <input className="obs-input" type="password" placeholder="Zendesk API token" value={config.api_token}
            onChange={(e) => onChange("api_token", e.target.value)} />
          <p style={hintStyle}>Admin Center → Apps &amp; Integrations → Zendesk API → API token</p>
        </div>
      </div>
      <div style={{ height: 1, background: "var(--border)" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "start" }}>
        <div>
          <label style={lblStyle}>Minimum priority to capture</label>
          <select className="obs-input" value={config.min_priority}
            onChange={(e) => onChange("min_priority", e.target.value)} style={{ width: "100%" }}>
            <option value="low">Low — capture everything</option>
            <option value="normal">Normal and above</option>
            <option value="high">High and above — serious issues only</option>
            <option value="urgent">Urgent only — emergencies</option>
          </select>
        </div>
        <div style={{ paddingTop: 22 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={config.exclude_closed}
              onChange={(e) => onChange("exclude_closed", e.target.checked)} style={{ accentColor: "var(--accent)" }} />
            <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Skip already solved tickets</span>
          </label>
        </div>
      </div>
    </div>
  );
}

function IntercomForm({ config, onChange }: {
  config: IntegrationsConfig["intercom"];
  onChange: (field: string, value: string | number | boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={lblStyle}>Access Token</label>
        <input className="obs-input" type="password" placeholder="Intercom access token" value={config.access_token}
          onChange={(e) => onChange("access_token", e.target.value)} />
        <p style={hintStyle}>Settings → Developers → Your app → Authentication → Access Token</p>
      </div>
      <div style={{ height: 1, background: "var(--border)" }} />
      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <input type="checkbox" checked={config.open_only}
          onChange={(e) => onChange("open_only", e.target.checked)} style={{ accentColor: "var(--accent)" }} />
        <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Open conversations only — skip closed or resolved chats</span>
      </label>
    </div>
  );
}

function JiraForm({ config, onChange }: {
  config: IntegrationsConfig["jira"];
  onChange: (field: string, value: string | number | boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lblStyle}>Domain</label>
          <input className="obs-input" placeholder="yourcompany.atlassian.net" value={config.domain}
            onChange={(e) => onChange("domain", e.target.value)} />
        </div>
        <div>
          <label style={lblStyle}>Project Key</label>
          <input className="obs-input" placeholder="PROJ" value={config.project_key}
            onChange={(e) => onChange("project_key", e.target.value)} />
        </div>
        <div>
          <label style={lblStyle}>Email</label>
          <input className="obs-input" placeholder="admin@yourcompany.com" value={config.email}
            onChange={(e) => onChange("email", e.target.value)} />
        </div>
        <div>
          <label style={lblStyle}>API Token</label>
          <input className="obs-input" type="password" placeholder="Jira API token" value={config.api_token}
            onChange={(e) => onChange("api_token", e.target.value)} />
        </div>
      </div>
      <p style={hintStyle}>id.atlassian.com → Security → Create and manage API tokens</p>
      <div style={{ height: 1, background: "var(--border)" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lblStyle}>Minimum priority to capture</label>
          <select className="obs-input" value={config.min_priority}
            onChange={(e) => onChange("min_priority", e.target.value)} style={{ width: "100%" }}>
            <option value="lowest">All — even lowest priority</option>
            <option value="low">Low and above</option>
            <option value="medium">Medium and above — recommended</option>
            <option value="high">High and above — urgent only</option>
            <option value="highest">Highest only — emergencies</option>
          </select>
        </div>
        <div>
          <label style={lblStyle}>Issue types <span style={{ textTransform: "none", fontSize: "0.7rem" }}>(optional)</span></label>
          <input className="obs-input" placeholder="Bug, Story, Epic" value={config.issue_types}
            onChange={(e) => onChange("issue_types", e.target.value)} />
          <p style={hintStyle}>Empty = capture all types</p>
        </div>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <input type="checkbox" checked={config.exclude_done}
          onChange={(e) => onChange("exclude_done", e.target.checked)} style={{ accentColor: "var(--accent)" }} />
        <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Skip issues already marked Done or Resolved</span>
      </label>
    </div>
  );
}

function AppStoreForm({ config, onChange }: {
  config: IntegrationsConfig["appstore"];
  onChange: (field: string, value: string | number | boolean) => void;
}) {
  const stars = Math.min(5, Math.max(1, config.max_rating || 3));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lblStyle}>iOS App ID</label>
          <input className="obs-input" placeholder="1234567890" value={config.app_id_ios}
            onChange={(e) => onChange("app_id_ios", e.target.value)} />
          <p style={hintStyle}>From App Store URL: .../id{"{ID}"}</p>
        </div>
        <div>
          <label style={lblStyle}>Android App ID <span style={{ textTransform: "none", fontSize: "0.7rem" }}>(coming soon)</span></label>
          <input className="obs-input" placeholder="com.yourcompany.app" value={config.app_id_android}
            onChange={(e) => onChange("app_id_android", e.target.value)} disabled />
        </div>
      </div>
      <div style={{ height: 1, background: "var(--border)" }} />
      <div>
        <label style={lblStyle}>Capture reviews rated this or below</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input className="obs-input" type="number" min={1} max={5} value={config.max_rating}
            onChange={(e) => onChange("max_rating", Number(e.target.value))} style={{ width: 72 }} />
          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            {"⭐".repeat(stars)} and below — these are your frustrated users
          </span>
        </div>
        <p style={hintStyle}>4–5 star reviews mean things are working. We skip those.</p>
      </div>
    </div>
  );
}

function GitHubForm({ config, onChange }: {
  config: IntegrationsConfig["github"];
  onChange: (field: string, value: string | number | boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div>
          <label style={lblStyle}>Owner</label>
          <input className="obs-input" placeholder="myorg" value={config.owner}
            onChange={(e) => onChange("owner", e.target.value)} />
        </div>
        <div>
          <label style={lblStyle}>Repository</label>
          <input className="obs-input" placeholder="my-repo" value={config.repo}
            onChange={(e) => onChange("repo", e.target.value)} />
        </div>
        <div>
          <label style={lblStyle}>Personal Access Token</label>
          <input className="obs-input" type="password" placeholder="github_pat_..." value={config.token}
            onChange={(e) => onChange("token", e.target.value)} />
        </div>
      </div>
      <p style={hintStyle}>Settings → Developer settings → Personal access tokens → Fine-grained (read:issues)</p>
      <div style={{ height: 1, background: "var(--border)" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lblStyle}>Min reactions to capture</label>
          <input className="obs-input" type="number" min={0} value={config.min_reactions}
            onChange={(e) => onChange("min_reactions", Number(e.target.value))} />
          <p style={hintStyle}>0 = capture all issues. Raise to filter solo reports.</p>
        </div>
        <div>
          <label style={lblStyle}>Label filter <span style={{ textTransform: "none", fontSize: "0.7rem" }}>(optional)</span></label>
          <input className="obs-input" placeholder="bug, enhancement, feedback" value={config.labels}
            onChange={(e) => onChange("labels", e.target.value)} />
          <p style={hintStyle}>Empty = capture all labels</p>
        </div>
      </div>
    </div>
  );
}

function RedditForm({ config, onChange }: {
  config: IntegrationsConfig["reddit"];
  onChange: (field: string, value: string | number | boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lblStyle}>Client ID</label>
          <input className="obs-input" placeholder="Reddit app client ID" value={config.client_id}
            onChange={(e) => onChange("client_id", e.target.value)} />
        </div>
        <div>
          <label style={lblStyle}>Client Secret</label>
          <input className="obs-input" type="password" placeholder="Reddit app client secret" value={config.client_secret}
            onChange={(e) => onChange("client_secret", e.target.value)} />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={lblStyle}>Subreddits to monitor</label>
          <input className="obs-input" placeholder="r/typescript, r/nextjs, r/yourproduct" value={config.subreddits}
            onChange={(e) => onChange("subreddits", e.target.value)} />
          <p style={hintStyle}>reddit.com/prefs/apps → Create App (script type) to get credentials</p>
        </div>
      </div>
      <div style={{ height: 1, background: "var(--border)" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lblStyle}>Minimum upvotes to capture</label>
          <input className="obs-input" type="number" min={0} value={config.min_score}
            onChange={(e) => onChange("min_score", Number(e.target.value))} />
          <p style={hintStyle}>Posts below this had no community traction</p>
        </div>
        <div>
          <label style={lblStyle}>Minimum comments <span style={{ textTransform: "none", fontSize: "0.7rem" }}>(optional)</span></label>
          <input className="obs-input" type="number" min={0} value={config.min_comments}
            onChange={(e) => onChange("min_comments", Number(e.target.value))} />
          <p style={hintStyle}>0 = upvotes alone are enough</p>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

function ConnectContent() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationsConfig>(defaultIntegrations);
  const [channels, setChannels] = useState<string[]>([]);
  const [selected, setSelected] = useState<SourceKey | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [userInitials, setUserInitials] = useState("?");
  const [hoveredSource, setHoveredSource] = useState<SourceKey | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const authRes = await fetch("/api/auth/session");
        if (!authRes.ok) { router.push("/login?redirect=/connect"); return; }
        const wsRes = await fetch("/api/workspace");
        if (!wsRes.ok) { router.push("/login?redirect=/connect"); return; }
        const wd = await wsRes.json();
        const ws: Workspace = wd.workspace;
        setWorkspace(ws);
        setChannels(ws.slack_monitored_channels ?? []);
        if (ws.integrations_config) {
          setIntegrations((prev) => ({ ...prev, ...ws.integrations_config }));
        }
        try {
          const sessionData = await authRes.clone().json().catch(() => null) || await fetch("/api/auth/session").then(r => r.json());
          const email: string = sessionData?.user?.email ?? "";
          if (email) setUserInitials(email.substring(0, 2).toUpperCase());
        } catch { /* ignore */ }
        setAuthChecked(true);
      } catch {
        router.push("/login?redirect=/connect");
      }
    })();
  }, [router]);

  const updateField = useCallback((source: SourceKey, field: string, value: string | number | boolean) => {
    setIntegrations((prev) => ({
      ...prev,
      [source]: { ...(prev[source as keyof IntegrationsConfig] as object), [field]: value },
    }));
  }, []);

  const saveSource = async (key: SourceKey) => {
    if (!workspace) return;
    setSaving(key);
    try {
      if (key === "slack") {
        await fetch("/api/workspace", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            updates: {
              slack_monitored_channels: channels,
              integrations_config: { ...integrations, slack: { ...integrations.slack, enabled: true } },
            },
          }),
        });
      } else {
        const updated = {
          ...integrations,
          [key]: { ...(integrations[key as keyof IntegrationsConfig] as object), enabled: true },
        };
        await fetch("/api/workspace", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates: { integrations_config: updated } }),
        });
        setIntegrations(updated);
      }
      setSaved(key);
      setTimeout(() => setSaved(null), 3000);
      const wsRes = await fetch("/api/workspace");
      const wd = await wsRes.json();
      if (wd.workspace) setWorkspace(wd.workspace);
    } finally {
      setSaving(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      await fetch("/api/analyze", { method: "POST" });
    } finally {
      setSyncing(false);
    }
  };

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, border: "2px solid rgba(249,115,22,0.2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const connectedCount = countConnected(workspace);
  const activeSrc = SOURCES.find((s) => s.key === selected);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <TopNav sourceCount={connectedCount} signalCount={0} userInitials={userInitials} />

      {/* ── Page header ── */}
      <div style={{
        maxWidth: 1320, margin: "0 auto",
        padding: "28px 24px 0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <h1 style={{ color: "#fff", fontWeight: 700, fontSize: "1.3rem", margin: "0 0 3px" }}>Sources</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
            Connect your stack — we pull signals automatically on every analysis run
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
            <span style={{ color: connectedCount > 0 ? "var(--accent)" : "var(--muted)", fontWeight: 700 }}>
              {connectedCount}
            </span>{" "}/ {SOURCES.length} connected
          </span>
          <button
            className="btn-primary"
            onClick={handleSyncAll}
            disabled={syncing || connectedCount === 0}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", padding: "8px 16px" }}
          >
            {syncing ? (
              <>
                <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                Syncing…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M1.5 6.5C1.5 3.74 3.74 1.5 6.5 1.5c1.6 0 3.02.72 3.99 1.85M11.5 6.5c0 2.76-2.24 5-5 5-1.6 0-3.02-.72-3.99-1.85" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M10.5 1v2.35H8.15M2.5 12V9.65H4.85" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sync All Sources
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Two-panel layout ── */}
      <div style={{
        maxWidth: 1320, margin: "0 auto",
        display: "flex", minHeight: "calc(100vh - 130px)",
        padding: "20px 24px 60px",
        gap: 0,
      }}>

        {/* ── LEFT PANEL: source list ── */}
        <div style={{
          width: 256, flexShrink: 0,
          borderRight: "1px solid var(--border)",
          paddingRight: 0,
          paddingTop: 4,
        }}>
          {GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom: 28 }}>
              {/* Group label */}
              <div style={{
                padding: "0 16px 8px",
                fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "var(--muted-dim)",
              }}>
                {group.label}
              </div>

              {/* Source items */}
              {group.keys.map((key) => {
                const src = SOURCES.find((s) => s.key === key)!;
                const connected = isConnected(key, workspace) || saved === key;
                const isSelected = selected === key;
                const isHovered = hoveredSource === key;

                return (
                  <button
                    key={key}
                    onClick={() => setSelected(isSelected ? null : key)}
                    onMouseEnter={() => setHoveredSource(key)}
                    onMouseLeave={() => setHoveredSource(null)}
                    style={{
                      width: "100%",
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 16px",
                      background: isSelected ? "rgba(249,115,22,0.07)" : isHovered ? "rgba(255,255,255,0.03)" : "transparent",
                      border: "none",
                      borderLeft: `2px solid ${isSelected ? "var(--accent)" : "transparent"}`,
                      cursor: "pointer",
                      transition: "background 0.12s, border-color 0.12s",
                      textAlign: "left",
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: connected ? "rgba(249,115,22,0.1)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${connected ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.07)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.9rem",
                    }}>
                      {src.icon}
                    </div>

                    {/* Name */}
                    <span style={{
                      flex: 1,
                      fontSize: "0.875rem",
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? "#fff" : "var(--muted-light)",
                      transition: "color 0.12s",
                    }}>
                      {src.label}
                    </span>

                    {/* Status dot */}
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                      background: connected ? "#22c55e" : "rgba(255,255,255,0.12)",
                      boxShadow: connected ? "0 0 5px rgba(34,197,94,0.4)" : "none",
                      transition: "background 0.2s",
                    }} />
                  </button>
                );
              })}
            </div>
          ))}

          {/* Coming soon */}
          <div style={{ marginTop: 8 }}>
            <div style={{
              padding: "0 16px 8px",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "var(--muted-dim)",
            }}>
              Coming Soon
            </div>
            {COMING_SOON.map((src) => (
              <div key={src.label} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 16px", opacity: 0.38, cursor: "default",
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.9rem",
                }}>
                  {src.icon}
                </div>
                <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--muted)" }}>
                  {src.label}
                </span>
                <span style={{
                  marginLeft: "auto",
                  fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.08em",
                  color: "var(--muted-dim)",
                  fontFamily: "var(--font-mono)",
                }}>
                  SOON
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL: detail / empty ── */}
        <div style={{ flex: 1, paddingLeft: 40, overflowY: "auto" }}>

          {/* Empty state */}
          {!selected && (
            <div style={{
              height: "100%", minHeight: 400,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 12, paddingBottom: 60,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.4rem",
              }}>
                ←
              </div>
              <p style={{ color: "var(--muted-light)", fontSize: "0.95rem", fontWeight: 500, margin: 0 }}>
                Select a source
              </p>
              <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: 0, textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
                We&apos;ll show you exactly what signals it surfaces on your dashboard before you connect anything.
              </p>
            </div>
          )}

          {/* Source detail */}
          {selected && activeSrc && (
            <div style={{ maxWidth: 680 }}>

              {/* ── Header ── */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: isConnected(selected, workspace) ? "rgba(249,115,22,0.1)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${isConnected(selected, workspace) ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.08)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.4rem",
                }}>
                  {activeSrc.icon}
                </div>
                <div style={{ paddingTop: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                    <h2 style={{ color: "#fff", fontWeight: 700, fontSize: "1.2rem", margin: 0 }}>
                      {activeSrc.label}
                    </h2>
                    {(isConnected(selected, workspace) || saved === selected) && (
                      <span style={{
                        fontSize: "0.62rem", fontWeight: 700,
                        color: "#22c55e", background: "rgba(34,197,94,0.1)",
                        padding: "2px 8px", borderRadius: 9999,
                        border: "1px solid rgba(34,197,94,0.25)",
                      }}>
                        ✓ Connected
                      </span>
                    )}
                  </div>
                  <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: 0, lineHeight: 1.5 }}>
                    {activeSrc.tagline}
                  </p>
                </div>
              </div>

              {/* ── Preview section ── */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span style={{
                    fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em",
                    textTransform: "uppercase", color: "var(--muted-dim)",
                  }}>
                    What you&apos;ll see on your dashboard
                  </span>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {PREVIEW_SIGNALS[selected].map((sig, i) => (
                    <PreviewSignalCard key={i} {...sig} />
                  ))}
                </div>
              </div>

              {/* ── Connect & configure form ── */}
              <SectionDivider label={isConnected(selected, workspace) ? "Reconfigure" : "Connect"} />

              {selected === "slack"    && <SlackForm workspaceId={workspace?.id ?? ""} config={integrations.slack} channels={channels} onChannelsChange={setChannels} onChange={(f, v) => updateField("slack", f, v)} />}
              {selected === "email"    && <EmailForm workspaceId={workspace?.id ?? ""} config={integrations.email} onChange={(f, v) => updateField("email", f, v)} />}
              {selected === "zendesk"  && <ZendeskForm config={integrations.zendesk}  onChange={(f, v) => updateField("zendesk", f, v)} />}
              {selected === "intercom" && <IntercomForm config={integrations.intercom} onChange={(f, v) => updateField("intercom", f, v)} />}
              {selected === "jira"     && <JiraForm config={integrations.jira}         onChange={(f, v) => updateField("jira", f, v)} />}
              {selected === "appstore" && <AppStoreForm config={integrations.appstore} onChange={(f, v) => updateField("appstore", f, v)} />}
              {selected === "github"   && <GitHubForm config={integrations.github}     onChange={(f, v) => updateField("github", f, v)} />}
              {selected === "reddit"   && <RedditForm config={integrations.reddit}     onChange={(f, v) => updateField("reddit", f, v)} />}

              {/* ── Save ── */}
              <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                <button
                  className="btn-primary"
                  onClick={() => saveSource(selected)}
                  disabled={saving === selected}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  {saving === selected ? (
                    <>
                      <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                      Saving…
                    </>
                  ) : saved === selected ? "✓ Saved" : isConnected(selected, workspace) ? "Update settings" : "Save & Enable"}
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
      <ConnectContent />
    </Suspense>
  );
}
