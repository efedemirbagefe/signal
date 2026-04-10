"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Workspace, DistributionConfig, IntegrationsConfig } from "@/lib/types";
import TopNav from "@/components/layout/TopNav";

// ── Types ───────────────────────────────────────────────────────────────────

type Tab = "profile" | "billing" | "notifications" | "account";

const TRIAL_LIMIT = 10;

function daysLeft(isoDate?: string): number {
  if (!isoDate) return 0;
  return Math.max(0, Math.ceil((new Date(isoDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

function fmtDate(isoDate?: string): string {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

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

// ── Billing plan badge ──────────────────────────────────────────────────────

function PlanBadge({ status, plan }: { status?: string; plan?: string }) {
  if (plan === "trial") return (
    <span style={{ background: "rgba(110,168,255,0.12)", color: "#6ea8ff", border: "1px solid rgba(110,168,255,0.25)", borderRadius: 9999, padding: "3px 12px", fontSize: "0.7rem", fontWeight: 700 }}>FREE TRIAL</span>
  );
  if (status === "active") return (
    <span style={{ background: "rgba(249,115,22,0.12)", color: "var(--accent)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 9999, padding: "3px 12px", fontSize: "0.7rem", fontWeight: 700 }}>PRO · ACTIVE</span>
  );
  if (status === "past_due") return (
    <span style={{ background: "rgba(255,209,102,0.12)", color: "#ffd166", border: "1px solid rgba(255,209,102,0.25)", borderRadius: 9999, padding: "3px 12px", fontSize: "0.7rem", fontWeight: 700 }}>PAST DUE</span>
  );
  if (status === "cancelled" || plan === "cancelled") return (
    <span style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 9999, padding: "3px 12px", fontSize: "0.7rem", fontWeight: 700 }}>CANCELLED</span>
  );
  return (
    <span style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 9999, padding: "3px 12px", fontSize: "0.7rem", fontWeight: 700 }}>EXPIRED</span>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInitials, setUserInitials] = useState("?");
  const [userEmail, setUserEmail] = useState("");

  // Profile
  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);

  // Notifications
  const [notifConfig, setNotifConfig] = useState({
    emailOnAnalysis: true,
    emailOnCritical: true,
    slackMentions: false,
  });

  // Account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const authRes = await fetch("/api/auth/session");
        if (!authRes.ok) { router.push("/login?redirect=/settings"); return; }

        try {
          const sessionData = await authRes.clone().json().catch(() => null) || await fetch("/api/auth/session").then(r => r.json());
          const email: string = sessionData?.user?.email ?? "";
          if (email) {
            setUserEmail(email);
            setUserInitials(email.substring(0, 2).toUpperCase());
          }
        } catch { /* ignore */ }

        const wsRes = await fetch("/api/workspace");
        if (wsRes.ok) {
          const wd = await wsRes.json();
          setWorkspace(wd.workspace ?? null);
        }
        setLoading(false);
      } catch {
        router.push("/login");
      }
    })();
  }, [router]);

  const saveProfile = async () => {
    setSavingProfile(true);
    // In production, save display name to user profile
    await new Promise((r) => setTimeout(r, 800));
    setSavingProfile(false);
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2500);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, border: "2px solid rgba(249,115,22,0.2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const tabs: Array<{ key: Tab; label: string; icon: string }> = [
    { key: "profile",       label: "Profile",       icon: "👤" },
    { key: "billing",       label: "Billing",        icon: "💳" },
    { key: "notifications", label: "Notifications",  icon: "🔔" },
    { key: "account",       label: "Account",        icon: "⚙️" },
  ];

  const plan = workspace?.plan ?? "trial";
  const polarStatus = workspace?.polar_status;
  const analysisCount = workspace?.analysis_count ?? 0;
  const trialDaysLeft = daysLeft(workspace?.trial_ends_at);
  const trialPct = Math.min(100, (analysisCount / TRIAL_LIMIT) * 100);
  const isActive = plan === "pro" && polarStatus === "active";
  const isPastDue = polarStatus === "past_due";
  const isTrial = plan === "trial";

  const proFeatures = [
    "Unlimited analysis runs",
    "All 8 signal sources",
    "Slack, Email & WhatsApp delivery",
    "Priority support",
    "Cancel anytime",
  ];

  const lblStyle: React.CSSProperties = {
    display: "block", color: "var(--muted)", fontSize: "0.75rem", fontWeight: 500,
    marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <TopNav sourceCount={0} signalCount={0} userInitials={userInitials} />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 24px 80px" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: "#fff", fontWeight: 700, fontSize: "1.4rem", margin: "0 0 4px" }}>Settings</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
            Manage your account, plan, and notification preferences
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24 }}>

          {/* ── Left sidebar tabs ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "10px 14px", borderRadius: 9, border: "none",
                  background: activeTab === tab.key ? "rgba(249,115,22,0.1)" : "transparent",
                  color: activeTab === tab.key ? "var(--accent)" : "var(--muted-light)",
                  cursor: "pointer", textAlign: "left", fontSize: "0.875rem",
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  transition: "all 0.15s",
                  outline: activeTab === tab.key ? "1px solid rgba(249,115,22,0.2)" : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.key) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.key) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: "0.9rem" }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}

            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />

            {/* Quick links */}
            {[
              { href: "/connect", label: "Sources", icon: "🌐" },
              { href: "/settings/distribution", label: "Distribution", icon: "📡" },
              { href: "/delivery-log", label: "Delivery Log", icon: "📋" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "9px 14px", borderRadius: 9, textDecoration: "none",
                  color: "var(--muted)", fontSize: "0.8rem", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--muted-light)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: "0.85rem" }}>{link.icon}</span>
                {link.label}
              </a>
            ))}
          </div>

          {/* ── Right content panel ── */}
          <div>

            {/* ───── Profile tab ───── */}
            {activeTab === "profile" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Avatar row */}
                <div style={{
                  background: "var(--card)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14, padding: "24px 28px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%",
                      background: "rgba(249,115,22,0.15)", border: "2px solid rgba(249,115,22,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.1rem", fontWeight: 700, color: "var(--accent)", flexShrink: 0,
                    }}>
                      {userInitials}
                    </div>
                    <div>
                      <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.95rem" }}>
                        {displayName || userEmail.split("@")[0]}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: 2 }}>{userEmail}</div>
                    </div>
                    <PlanBadge plan={plan} status={polarStatus} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={lblStyle}>Display name</label>
                      <input
                        className="obs-input"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={userEmail.split("@")[0]}
                        style={{ maxWidth: 320 }}
                      />
                    </div>
                    <div>
                      <label style={lblStyle}>Email address</label>
                      <input
                        className="obs-input"
                        value={userEmail}
                        disabled
                        style={{ maxWidth: 320, opacity: 0.5, cursor: "not-allowed" }}
                      />
                      <p style={{ color: "var(--muted)", fontSize: "0.72rem", marginTop: 4 }}>
                        Email is managed by your auth provider
                      </p>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={saveProfile}
                      disabled={savingProfile}
                      style={{ alignSelf: "flex-start", fontSize: "0.875rem", padding: "8px 18px" }}
                    >
                      {savingProfile ? "Saving…" : savedProfile ? "✓ Saved" : "Save Profile"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ───── Billing tab ───── */}
            {activeTab === "billing" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Alert banners */}
                {(plan === "cancelled" || plan === "expired") && (
                  <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
                    <span>⚠️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#ef4444", fontWeight: 600, fontSize: "0.875rem" }}>
                        {plan === "cancelled" ? "Subscription cancelled" : "Trial expired"}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>Upgrade to Pro to continue running analyses.</div>
                    </div>
                    <a href="/api/billing/checkout" className="btn-primary" style={{ textDecoration: "none", fontSize: "0.8rem", padding: "7px 14px", whiteSpace: "nowrap" }}>
                      Upgrade →
                    </a>
                  </div>
                )}

                {isPastDue && (
                  <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(255,209,102,0.08)", border: "1px solid rgba(255,209,102,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
                    <span>⚡</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#ffd166", fontWeight: 600, fontSize: "0.875rem" }}>Payment failed</div>
                      <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>Update your payment method to avoid interruption.</div>
                    </div>
                    <a href="/api/billing/portal" style={{ textDecoration: "none", color: "#ffd166", fontSize: "0.8rem", fontWeight: 600, border: "1px solid rgba(255,209,102,0.25)", padding: "7px 14px", borderRadius: 8, whiteSpace: "nowrap" }}>
                      Update →
                    </a>
                  </div>
                )}

                {/* Plan card */}
                <div style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "24px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <h3 style={{ color: "#fff", fontWeight: 600, fontSize: "1rem", margin: 0 }}>Current plan</h3>
                    <PlanBadge plan={plan} status={polarStatus} />
                  </div>

                  {isTrial && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Trial ends in</span>
                        <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 600 }}>{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Analyses used</span>
                        <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 600 }}>{analysisCount} / {TRIAL_LIMIT}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 9999, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginTop: 4 }}>
                        <div style={{ height: "100%", width: `${trialPct}%`, borderRadius: 9999, background: trialPct >= 80 ? "#ef4444" : "var(--accent)", transition: "width 0.3s" }} />
                      </div>
                    </div>
                  )}

                  {(isActive || isPastDue) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Renews on</span>
                        <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 600 }}>{fmtDate(workspace?.polar_renews_at)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Analyses this month</span>
                        <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 600 }}>{analysisCount} runs</span>
                      </div>
                      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                        <a href="/api/billing/portal" style={{ textDecoration: "none", color: "var(--muted-light)", fontSize: "0.8rem", padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
                          Manage billing →
                        </a>
                        <a href="/api/billing/portal" style={{ textDecoration: "none", color: "var(--muted-light)", fontSize: "0.8rem", padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
                          View invoices →
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upgrade card */}
                {(isTrial || plan === "cancelled" || plan === "expired") && (
                  <div style={{ padding: 28, borderRadius: 14, background: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.2)", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "50%", height: 1, background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.5), transparent)" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem", marginBottom: 4 }}>Upgrade to Pro</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 18 }}>
                          <span style={{ color: "var(--accent)", fontWeight: 800, fontSize: "1.8rem", letterSpacing: "-0.02em" }}>$49</span>
                          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>/ month</span>
                        </div>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                          {proFeatures.map((f) => (
                            <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>
                              <span style={{ color: "var(--accent)", flexShrink: 0 }}>✓</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
                        <a href="/api/billing/checkout" className="btn-primary" style={{ textDecoration: "none", fontSize: "0.875rem", padding: "10px 22px", textAlign: "center" }}>
                          Upgrade Now →
                        </a>
                        <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.7rem" }}>Secure · Cancel anytime</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ───── Notifications tab ───── */}
            {activeTab === "notifications" && (
              <div style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "24px 28px" }}>
                <h3 style={{ color: "#fff", fontWeight: 600, fontSize: "1rem", margin: "0 0 20px" }}>
                  Notification preferences
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {[
                    { key: "emailOnAnalysis" as const, label: "Analysis complete", desc: "Get notified when an analysis run finishes" },
                    { key: "emailOnCritical" as const, label: "Critical signals", desc: "Alert when a critical-severity signal is detected" },
                    { key: "slackMentions" as const,   label: "Slack mentions",   desc: "Receive a Slack DM for new high-priority signals" },
                  ].map((item, i, arr) => (
                    <div
                      key={item.key}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "16px 0",
                        borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                      }}
                    >
                      <div>
                        <div style={{ color: "#fff", fontWeight: 500, fontSize: "0.875rem", marginBottom: 2 }}>{item.label}</div>
                        <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{item.desc}</div>
                      </div>
                      <Toggle
                        checked={notifConfig[item.key]}
                        onChange={(v) => setNotifConfig((p) => ({ ...p, [item.key]: v }))}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ color: "var(--muted)", fontSize: "0.78rem", margin: "0 0 14px" }}>
                    Email notifications are sent to <span style={{ color: "var(--muted-light)" }}>{userEmail}</span>
                  </p>
                  <button className="btn-primary" style={{ fontSize: "0.875rem", padding: "8px 18px" }}>
                    Save preferences
                  </button>
                </div>
              </div>
            )}

            {/* ───── Account tab ───── */}
            {activeTab === "account" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Workspace info */}
                <div style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "24px 28px" }}>
                  <h3 style={{ color: "#fff", fontWeight: 600, fontSize: "1rem", margin: "0 0 18px" }}>Workspace</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Workspace ID</span>
                      <code style={{ color: "var(--muted-light)", fontSize: "0.78rem", background: "rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: 5, fontFamily: "monospace" }}>
                        {workspace?.id?.slice(0, 20)}…
                      </code>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Plan</span>
                      <PlanBadge plan={plan} status={polarStatus} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Total analyses run</span>
                      <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>{analysisCount}</span>
                    </div>
                  </div>
                </div>

                {/* Danger zone */}
                <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 14, padding: "24px 28px" }}>
                  <h3 style={{ color: "#ef4444", fontWeight: 600, fontSize: "1rem", margin: "0 0 6px" }}>Danger zone</h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: "0 0 18px" }}>
                    Irreversible and destructive actions. Proceed with caution.
                  </p>

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      style={{
                        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                        color: "#ef4444", borderRadius: 8, padding: "9px 18px",
                        fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.14)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                    >
                      Delete workspace
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <p style={{ color: "#ef4444", fontSize: "0.85rem", margin: 0, fontWeight: 500 }}>
                        Are you sure? This will permanently delete all your signals, clusters, and settings.
                      </p>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          style={{
                            background: "#ef4444", border: "none", color: "#fff",
                            borderRadius: 8, padding: "8px 16px", fontSize: "0.875rem",
                            fontWeight: 600, cursor: "not-allowed", opacity: 0.7,
                          }}
                          title="Contact support to delete your workspace"
                          disabled
                        >
                          Yes, delete everything
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          style={{
                            background: "none", border: "1px solid rgba(255,255,255,0.12)",
                            color: "var(--muted-light)", borderRadius: 8, padding: "8px 14px",
                            fontSize: "0.875rem", cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                      <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0 }}>
                        To permanently delete your workspace, contact <a href="mailto:support@observer-ai.com" style={{ color: "var(--accent)" }}>support@observer-ai.com</a>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
