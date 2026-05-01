"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import TopNav from "@/components/layout/TopNav";
import type { IntegrationsConfig } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type ActiveSourceKey =
  | "appstore"
  | "email"
  | "reddit"
  | "zendesk"
  | "intercom"
  | "slack"
  | "github"
  | "jira";

interface Workspace {
  id: string;
  gmail_token?: string;
  slack_token?: string;
  integrations_config?: IntegrationsConfig;
  distribution_config?: Record<string, unknown>;
}

// ── Source definitions ────────────────────────────────────────────────────────

interface ActiveSource {
  key: ActiveSourceKey;
  label: string;
  icon: string;
  color: string;
  description: string;
  category: string;
}

const ACTIVE_SOURCES: ActiveSource[] = [
  {
    key: "appstore",
    label: "App Store",
    icon: "🍎",
    color: "#000000",
    description: "iOS app reviews — surface low-rated feedback automatically",
    category: "App Reviews",
  },
  {
    key: "email",
    label: "Support Email",
    icon: "✉️",
    color: "#EA4335",
    description: "Customer support inbox — turn emails into structured signals",
    category: "Customer Support",
  },
  {
    key: "reddit",
    label: "Reddit",
    icon: "🔴",
    color: "#FF4500",
    description: "Subreddit monitoring — track community sentiment about your product",
    category: "Community",
  },
  {
    key: "zendesk",
    label: "Zendesk",
    icon: "🎫",
    color: "#03363D",
    description: "Support tickets — detect recurring pain points across your customer base",
    category: "Support",
  },
  {
    key: "intercom",
    label: "Intercom",
    icon: "💬",
    color: "#1F8EED",
    description: "Live chat & conversations — capture real-time friction signals",
    category: "Support",
  },
  {
    key: "slack",
    label: "Slack",
    icon: "⚡",
    color: "#4A154B",
    description: "Workspace channels — listen to what your team hears from customers",
    category: "Team",
  },
  {
    key: "github",
    label: "GitHub Issues",
    icon: "🐙",
    color: "#24292E",
    description: "Issues & feature requests — ground gaps in engineering reality",
    category: "Engineering",
  },
  {
    key: "jira",
    label: "Jira",
    icon: "📋",
    color: "#0052CC",
    description: "Tickets & epics — correlate product decisions with delivery status",
    category: "Engineering",
  },
];

const COMING_SOON = [
  { label: "Google Play",       icon: "▶",  category: "App Reviews" },
  { label: "Google Analytics",  icon: "📊", category: "Analytics" },
  { label: "Salesforce",        icon: "☁️", category: "CRM" },
  { label: "HubSpot",           icon: "🧲", category: "CRM" },
];

// ── Default configs ───────────────────────────────────────────────────────────

const DEFAULT_CONFIGS: Record<ActiveSourceKey, Record<string, unknown>> = {
  appstore:  { enabled: false, app_id_ios: "", max_rating: 3, last_sync: null },
  email:     { enabled: false, max_age_days: 7, sender_domains: "", last_sync: null },
  reddit:    { enabled: false, client_id: "", client_secret: "", subreddits: "", min_score: 10, last_sync: null },
  zendesk:   { enabled: false, subdomain: "", email: "", api_token: "", min_priority: "normal", exclude_closed: true, last_sync: null },
  intercom:  { enabled: false, access_token: "", open_only: true, last_sync: null },
  slack:     { enabled: false, max_age_days: 7, keyword_filter: "", last_sync: null },
  github:    { enabled: false, token: "", owner: "", repo: "", min_reactions: 0, labels: "", last_sync: null },
  jira:      { enabled: false, domain: "", email: "", api_token: "", project_key: "", min_priority: "medium", exclude_done: true, issue_types: "", last_sync: null },
};

// ── Config form fields per source ─────────────────────────────────────────────

interface FormField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "password" | "number" | "textarea" | "select" | "checkbox";
  hint?: string;
  options?: { value: string | number; label: string }[];
}

const SOURCE_FIELDS: Record<ActiveSourceKey, FormField[]> = {
  appstore: [
    { key: "app_id_ios", label: "App Store App ID", placeholder: "e.g. 123456789", hint: "Find it in App Store Connect under App Information" },
    { key: "max_rating", label: "Max Star Rating",  placeholder: "3", type: "select", options: [{ value: 1, label: "1 star only" }, { value: 2, label: "2 stars and below" }, { value: 3, label: "3 stars and below" }], hint: "Only pull reviews at or below this rating" },
  ],
  email: [
    { key: "sender_domains", label: "Sender Domain Filter",   placeholder: "yourcompany.com, enterprise.io", hint: "Comma-separated domains to watch. Leave empty to capture all inbound." },
    { key: "max_age_days",   label: "Lookback Window (days)", placeholder: "7", type: "number", hint: "Only pull emails from the last N days per sync" },
  ],
  reddit: [
    { key: "client_id",     label: "Reddit App Client ID",     placeholder: "AbCdEfGhIj1234", hint: "Create an app at reddit.com/prefs/apps" },
    { key: "client_secret", label: "Reddit App Client Secret", placeholder: "••••••••••••••••", type: "password" },
    { key: "subreddits",    label: "Subreddits",               placeholder: "r/yourproduct, r/competitorproduct", hint: "Comma-separated. r/ prefix is optional." },
    { key: "min_score",     label: "Minimum Post Score",       placeholder: "10", type: "number", hint: "Only pull posts with at least this many upvotes" },
  ],
  zendesk: [
    { key: "subdomain",    label: "Zendesk Subdomain", placeholder: "yourcompany",          hint: "The part before .zendesk.com in your URL" },
    { key: "email",        label: "Agent Email",       placeholder: "you@yourcompany.com" },
    { key: "api_token",    label: "API Token",         placeholder: "••••••••••••••••",     type: "password", hint: "Create in Zendesk Admin → Apps & Integrations → Zendesk API" },
    { key: "min_priority", label: "Min Priority",      placeholder: "normal",               type: "select", options: [{ value: "low", label: "Low & above" }, { value: "normal", label: "Normal & above" }, { value: "high", label: "High & above" }, { value: "urgent", label: "Urgent only" }], hint: "Only pull tickets at or above this priority" },
  ],
  intercom: [
    { key: "access_token", label: "Access Token", placeholder: "••••••••••••••••", type: "password", hint: "Create in Intercom Developer Hub → Your App → Authentication" },
    { key: "open_only",    label: "Open conversations only", placeholder: "", type: "checkbox", hint: "Uncheck to include resolved conversations" },
  ],
  slack: [
    { key: "max_age_days",   label: "Lookback Window (days)", placeholder: "7", type: "number", hint: "Only pull messages from the last N days per sync" },
    { key: "keyword_filter", label: "Keyword Filter (optional)", placeholder: "bug, broken, feedback, request", hint: "Comma-separated keywords. Leave empty to capture all messages." },
  ],
  github: [
    { key: "token",         label: "Personal Access Token", placeholder: "ghp_••••••••••••••••", type: "password", hint: "Needs repo:read scope. Create in GitHub → Settings → Developer Settings → PAT" },
    { key: "owner",         label: "Repository Owner",      placeholder: "your-org",       hint: "GitHub username or org name" },
    { key: "repo",          label: "Repository Name",       placeholder: "your-repo",      hint: "The repo slug (without the owner prefix)" },
    { key: "labels",        label: "Label Filter (optional)", placeholder: "bug, feature-request, feedback", hint: "Comma-separated label names. Leave empty to pull all issues." },
    { key: "min_reactions", label: "Minimum Reactions",     placeholder: "0", type: "number", hint: "Only pull issues with at least this many 👍 reactions" },
  ],
  jira: [
    { key: "domain",       label: "Jira Domain",    placeholder: "yourcompany.atlassian.net", hint: "Your Atlassian domain without https://" },
    { key: "email",        label: "Account Email",  placeholder: "you@yourcompany.com" },
    { key: "api_token",    label: "API Token",      placeholder: "••••••••••••••••", type: "password", hint: "Create in id.atlassian.com → API Tokens" },
    { key: "project_key",  label: "Project Key",    placeholder: "PROD", hint: "The key shown in Jira next to your project name (e.g. PROD, ENG)" },
    { key: "issue_types",  label: "Issue Types (optional)", placeholder: "Bug, Story, Task", hint: "Comma-separated. Leave empty to pull all types." },
    { key: "min_priority", label: "Min Priority",   placeholder: "medium", type: "select", options: [{ value: "lowest", label: "Lowest & above" }, { value: "low", label: "Low & above" }, { value: "medium", label: "Medium & above" }, { value: "high", label: "High & above" }, { value: "highest", label: "Highest only" }], hint: "Only pull issues at or above this priority" },
  ],
};

// ── Connection status helper ──────────────────────────────────────────────────

function isConnected(key: ActiveSourceKey, workspace: Workspace | null): boolean {
  if (!workspace) return false;
  if (key === "email") return !!workspace.gmail_token;
  if (key === "slack") return !!workspace.slack_token;
  const config = workspace.integrations_config?.[key as keyof IntegrationsConfig] as Record<string, unknown> | undefined;
  return !!(config?.enabled);
}

function getConnectedCount(workspace: Workspace | null): number {
  return ACTIVE_SOURCES.filter((s) => isConnected(s.key, workspace)).length;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function ConnectPageContent() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ActiveSourceKey | null>(null);
  const [formValues, setFormValues] = useState<Record<ActiveSourceKey, Record<string, unknown>>>({
    appstore:  { ...DEFAULT_CONFIGS.appstore },
    email:     { ...DEFAULT_CONFIGS.email },
    reddit:    { ...DEFAULT_CONFIGS.reddit },
    zendesk:   { ...DEFAULT_CONFIGS.zendesk },
    intercom:  { ...DEFAULT_CONFIGS.intercom },
    slack:     { ...DEFAULT_CONFIGS.slack },
    github:    { ...DEFAULT_CONFIGS.github },
    jira:      { ...DEFAULT_CONFIGS.jira },
  });
  const [saving, setSaving] = useState(false);
  const [savedKey, setSavedKey] = useState<ActiveSourceKey | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadWorkspace = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace");
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) return;
      const data: Workspace = await res.json();
      setWorkspace(data);

      // Hydrate form values from saved config
      const ic = data.integrations_config;
      if (ic) {
        setFormValues((prev) => {
          const next = { ...prev };
          for (const key of ["appstore", "email", "reddit", "zendesk", "intercom", "slack", "github", "jira"] as ActiveSourceKey[]) {
            const saved = ic[key as keyof IntegrationsConfig] as unknown as Record<string, unknown> | undefined;
            if (saved) next[key] = { ...DEFAULT_CONFIGS[key], ...saved };
          }
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadWorkspace(); }, [loadWorkspace]);

  async function saveSource(key: ActiveSourceKey) {
    setSaving(true);
    try {
      const values = { ...formValues[key], enabled: true };
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrations_config: { [key]: values } }),
      });
      if (res.ok) {
        setSavedKey(key);
        setTimeout(() => setSavedKey(null), 2500);
        await loadWorkspace();
      }
    } finally {
      setSaving(false);
    }
  }

  async function disconnectSource(key: ActiveSourceKey) {
    await fetch("/api/workspace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ integrations_config: { [key]: { ...formValues[key], enabled: false } } }),
    });
    await loadWorkspace();
  }

  async function syncAll() {
    setSyncing(true);
    try {
      const connected = ACTIVE_SOURCES.filter((s) => isConnected(s.key, workspace));
      await Promise.allSettled(
        connected.map((s) => fetch(`/api/ingest/${s.key}`, { method: "POST" }))
      );
      router.push("/dashboard");
    } finally {
      setSyncing(false);
    }
  }

  const connectedCount = getConnectedCount(workspace);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem" }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <TopNav sourceCount={getConnectedCount(workspace)} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em" }}>
              Data Sources
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.6 }}>
              Connect your platforms. Signal ingests, clusters, and prioritises feedback automatically.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            {/* Progress pill */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20 }}>
              <div style={{ display: "flex", gap: 3 }}>
                {ACTIVE_SOURCES.map((s) => (
                  <div key={s.key} style={{ width: 6, height: 6, borderRadius: "50%", background: isConnected(s.key, workspace) ? "#22c55e" : "rgba(255,255,255,0.12)" }} />
                ))}
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: connectedCount > 0 ? "#4ade80" : "var(--muted)", fontFamily: "'JetBrains Mono', monospace" }}>
                {connectedCount}/{ACTIVE_SOURCES.length} connected
              </span>
            </div>
            {connectedCount > 0 && (
              <button
                onClick={syncAll}
                disabled={syncing}
                style={{ padding: "8px 18px", borderRadius: 8, background: syncing ? "rgba(249,115,22,0.5)" : "var(--accent)", border: "none", color: "#fff", fontSize: "0.8rem", fontWeight: 700, cursor: syncing ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                {syncing ? "Syncing…" : "↻ Sync & Analyse"}
              </button>
            )}
          </div>
        </div>

        {/* ── Active Sources Grid + Detail ── */}
        <div style={{ display: "grid", gridTemplateColumns: selected ? "340px 1fr" : "1fr", gap: 20, alignItems: "start", marginBottom: 48 }}>

          {/* Source Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--muted-dim)", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
              Active Sources
            </div>
            {ACTIVE_SOURCES.map((source) => {
              const connected = isConnected(source.key, workspace);
              const isActive = selected === source.key;
              return (
                <button
                  key={source.key}
                  onClick={() => setSelected(isActive ? null : source.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                    background: isActive ? "rgba(249,115,22,0.06)" : "var(--card)",
                    border: `1px solid ${isActive ? "rgba(249,115,22,0.35)" : "var(--border)"}`,
                    borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.12s",
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${source.color}18`, border: `1px solid ${source.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                    {source.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#fff" }}>{source.label}</span>
                      <span style={{ fontSize: "0.6rem", fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: "var(--muted-dim)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {source.category}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2, lineHeight: 1.5 }}>{source.description}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {connected ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.65rem", fontWeight: 700, color: "#4ade80", fontFamily: "'JetBrains Mono', monospace" }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
                        LIVE
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.65rem", fontWeight: 600, color: isActive ? "var(--accent)" : "var(--muted-dim)" }}>
                        {isActive ? "▲" : "Connect →"}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Config Panel */}
          {selected && (() => {
            const src = ACTIVE_SOURCES.find((s) => s.key === selected)!;
            const connected = isConnected(selected, workspace);
            const fields = SOURCE_FIELDS[selected];
            return (
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", position: "sticky", top: 88 }}>
                {/* Panel Header */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "1.2rem" }}>{src.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#fff" }}>{src.label}</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace" }}>{src.category}</div>
                    </div>
                  </div>
                  {connected && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.65rem", fontWeight: 700, color: "#4ade80", padding: "3px 8px", background: "rgba(34,197,94,0.1)", borderRadius: 6, border: "1px solid rgba(34,197,94,0.2)" }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
                      Connected
                    </span>
                  )}
                </div>

                {/* Special: Email OAuth */}
                {selected === "email" && !workspace?.gmail_token ? (
                  <div style={{ padding: 24 }}>
                    <p style={{ margin: "0 0 20px", fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.65 }}>
                      Connect your Gmail account to ingest support emails as signals. Signal only reads — never sends.
                    </p>
                    <a
                      href="/api/auth/gmail"
                      style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 8, background: "#EA4335", border: "none", color: "#fff", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none" }}
                    >
                      <span>✉️</span> Connect Gmail
                    </a>
                    {formValues.email && (
                      <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--muted-dim)", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", marginBottom: 14 }}>Filters</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                          {fields.map((f) => renderField(f, selected, formValues, setFormValues))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : selected === "slack" && !workspace?.slack_token ? (
                  /* Special: Slack OAuth */
                  <div style={{ padding: 24 }}>
                    <p style={{ margin: "0 0 20px", fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.65 }}>
                      Connect your Slack workspace to ingest channel messages as signals. Signal reads public channels you&apos;ve invited it to.
                    </p>
                    <a
                      href={`/api/auth/slack?state=${workspace?.id ?? ""}`}
                      style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 8, background: "#4A154B", border: "none", color: "#fff", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none" }}
                    >
                      <span>⚡</span> Connect Slack
                    </a>
                    <p style={{ margin: "16px 0 0", fontSize: "0.72rem", color: "var(--muted-dim)", lineHeight: 1.55 }}>
                      After connecting, invite the Signal bot to channels: <code style={{ background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace" }}>/invite @signal</code>
                    </p>
                  </div>
                ) : (
                  <div style={{ padding: 24 }}>
                    {/* Slack re-auth link if already connected */}
                    {selected === "slack" && workspace?.slack_token && (
                      <div style={{ marginBottom: 20, padding: "10px 14px", background: "rgba(74,21,75,0.15)", border: "1px solid rgba(74,21,75,0.3)", borderRadius: 8 }}>
                        <div style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.55 }}>
                          Slack workspace connected. Adjust ingestion settings below.{" "}
                          <a href={`/api/auth/slack?state=${workspace?.id ?? ""}`} style={{ color: "var(--accent)", textDecoration: "none" }}>Re-authenticate →</a>
                        </div>
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      {fields.map((f) => renderField(f, selected, formValues, setFormValues))}
                    </div>
                    <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
                      <button
                        onClick={() => saveSource(selected)}
                        disabled={saving}
                        style={{ flex: 1, padding: "10px 16px", borderRadius: 8, background: savedKey === selected ? "#22c55e" : saving ? "rgba(249,115,22,0.5)" : "var(--accent)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.82rem", cursor: saving ? "default" : "pointer", transition: "background 0.2s" }}
                      >
                        {savedKey === selected ? "✓ Saved" : saving ? "Saving…" : connected ? "Update" : "Connect"}
                      </button>
                      {connected && (
                        <button
                          onClick={() => disconnectSource(selected)}
                          style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" }}
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── Coming Soon ── */}
        <div>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--muted-dim)", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", marginBottom: 12 }}>
            Coming Soon
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
            {COMING_SOON.map((s) => (
              <div
                key={s.label}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, opacity: 0.5 }}
              >
                <span style={{ fontSize: "0.95rem" }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#fff" }}>{s.label}</div>
                  <div style={{ fontSize: "0.6rem", color: "var(--muted-dim)", fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>{s.category}</div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: "0.55rem", fontWeight: 700, color: "var(--accent)", padding: "1px 5px", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>SOON</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Render field helper ───────────────────────────────────────────────────────

function renderField(
  f: FormField,
  sourceKey: ActiveSourceKey,
  formValues: Record<ActiveSourceKey, Record<string, unknown>>,
  setFormValues: React.Dispatch<React.SetStateAction<Record<ActiveSourceKey, Record<string, unknown>>>>
) {
  const val = formValues[sourceKey][f.key] ?? "";
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 7,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff", fontSize: "0.82rem", outline: "none", fontFamily: "inherit",
    boxSizing: "border-box",
  };

  return (
    <div key={f.key}>
      <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>
        {f.label}
      </label>
      {f.type === "checkbox" ? (
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={Boolean(val)}
            onChange={(e) => setFormValues((p) => ({ ...p, [sourceKey]: { ...p[sourceKey], [f.key]: e.target.checked } }))}
            style={{ width: 16, height: 16, accentColor: "var(--accent)", cursor: "pointer" }}
          />
          <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{f.hint}</span>
        </label>
      ) : f.type === "textarea" ? (
        <textarea
          value={String(val)}
          onChange={(e) => setFormValues((p) => ({ ...p, [sourceKey]: { ...p[sourceKey], [f.key]: e.target.value } }))}
          placeholder={f.placeholder}
          rows={4}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
        />
      ) : f.type === "select" && f.options ? (
        <select
          value={String(val)}
          onChange={(e) => setFormValues((p) => ({ ...p, [sourceKey]: { ...p[sourceKey], [f.key]: e.target.value } }))}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          {f.options.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
        </select>
      ) : (
        <input
          type={f.type ?? "text"}
          value={String(val)}
          onChange={(e) => setFormValues((p) => ({ ...p, [sourceKey]: { ...p[sourceKey], [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value } }))}
          placeholder={f.placeholder}
          style={inputStyle}
        />
      )}
      {f.hint && f.type !== "checkbox" && (
        <div style={{ marginTop: 5, fontSize: "0.67rem", color: "var(--muted-dim)", lineHeight: 1.55 }}>{f.hint}</div>
      )}
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function ConnectPage() {
  return (
    <Suspense fallback={null}>
      <ConnectPageContent />
    </Suspense>
  );
}
