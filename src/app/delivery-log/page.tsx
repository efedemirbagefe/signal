"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/layout/TopNav";

// ── Types ───────────────────────────────────────────────────────────────────

interface Delivery {
  id: string;
  cluster_id: string;
  channel: "slack" | "email" | "whatsapp";
  recipient: string;
  sent_at: string;
  status: "sent" | "failed" | "pending";
  subject?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function timeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function channelIcon(ch: string): string {
  if (ch === "slack") return "⚡";
  if (ch === "email") return "✉️";
  if (ch === "whatsapp") return "💬";
  return "📬";
}

function channelLabel(ch: string): string {
  if (ch === "slack") return "Slack";
  if (ch === "email") return "Email";
  if (ch === "whatsapp") return "WhatsApp";
  return ch;
}

function statusColor(status: string): { bg: string; text: string; border: string } {
  if (status === "sent")    return { bg: "rgba(249,115,22,0.1)",  text: "var(--accent)",  border: "rgba(249,115,22,0.25)" };
  if (status === "failed")  return { bg: "rgba(239,68,68,0.1)",   text: "#ef4444",        border: "rgba(239,68,68,0.25)" };
  if (status === "pending") return { bg: "rgba(255,255,255,0.06)", text: "var(--muted-light)", border: "rgba(255,255,255,0.1)" };
  return { bg: "rgba(255,255,255,0.06)", text: "var(--muted)", border: "rgba(255,255,255,0.1)" };
}

// ── Mock data for empty state illustration ──────────────────────────────────

const DEMO_DELIVERIES: Delivery[] = []; // Real data from API

// ── Page ────────────────────────────────────────────────────────────────────

export default function DeliveryLogPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>(DEMO_DELIVERIES);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [userInitials, setUserInitials] = useState("?");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      try {
        const authRes = await fetch("/api/auth/session");
        if (!authRes.ok) { router.push("/login?redirect=/delivery-log"); return; }

        try {
          const sessionData = await authRes.clone().json().catch(() => null) || await fetch("/api/auth/session").then(r => r.json());
          const email: string = sessionData?.user?.email ?? "";
          if (email) setUserInitials(email.substring(0, 2).toUpperCase());
        } catch { /* ignore */ }

        // Fetch deliveries from workspace
        const wsRes = await fetch("/api/workspace");
        if (wsRes.ok) {
          const wd = await wsRes.json();
          // In the future: fetch from a deliveries table
          // For now, check if distribution_config exists to show a more helpful state
          setDeliveries([]);
        }

        setAuthChecked(true);
        setLoading(false);
      } catch {
        router.push("/login?redirect=/delivery-log");
      }
    })();
  }, [router]);

  const filtered = deliveries.filter((d) => {
    if (channelFilter !== "all" && d.channel !== channelFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: deliveries.length,
    sent: deliveries.filter((d) => d.status === "sent").length,
    failed: deliveries.filter((d) => d.status === "failed").length,
    pending: deliveries.filter((d) => d.status === "pending").length,
  };

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, border: "2px solid rgba(249,115,22,0.2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const filterTabStyle = (active: boolean): React.CSSProperties => ({
    padding: "5px 12px", borderRadius: 7, fontSize: "0.78rem", fontWeight: 500,
    cursor: "pointer", border: "none", transition: "all 0.15s",
    background: active ? "rgba(249,115,22,0.12)" : "transparent",
    color: active ? "var(--accent)" : "var(--muted)",
    outline: active ? "1px solid rgba(249,115,22,0.25)" : "1px solid transparent",
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <TopNav sourceCount={0} signalCount={0} userInitials={userInitials} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 80px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ color: "#fff", fontWeight: 700, fontSize: "1.4rem", margin: "0 0 4px" }}>Delivery Log</h1>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
              All outbound brief deliveries across channels
            </p>
          </div>
          <a
            href="/settings/distribution"
            style={{
              color: "var(--muted-light)", fontSize: "0.82rem", fontWeight: 500,
              textDecoration: "none", padding: "8px 14px",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
              transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "var(--muted-light)"; }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Configure channels
          </a>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Total Deliveries", value: stats.total, color: "#fff" },
            { label: "Delivered", value: stats.sent, color: "var(--accent)" },
            { label: "Failed", value: stats.failed, color: "#ef4444" },
            { label: "Pending", value: stats.pending, color: "var(--muted-light)" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "var(--card)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12, padding: "16px 20px",
            }}>
              <div style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                {s.label}
              </div>
              <div style={{ color: s.color, fontWeight: 700, fontSize: "1.5rem", lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        {deliveries.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {["all", "slack", "email", "whatsapp"].map((ch) => (
                <button key={ch} style={filterTabStyle(channelFilter === ch)} onClick={() => setChannelFilter(ch)}>
                  {ch === "all" ? "All channels" : channelLabel(ch)}
                </button>
              ))}
            </div>
            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />
            <div style={{ display: "flex", gap: 4 }}>
              {["all", "sent", "failed", "pending"].map((st) => (
                <button key={st} style={filterTabStyle(statusFilter === st)} onClick={() => setStatusFilter(st)}>
                  {st === "all" ? "All statuses" : st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Table or empty state ── */}
        <div style={{
          background: "var(--card)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}>
          {deliveries.length === 0 ? (
            /* ── Empty state ── */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.6rem", marginBottom: 20,
              }}>
                📬
              </div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: "1rem", marginBottom: 8 }}>
                No deliveries yet
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", maxWidth: 380, lineHeight: 1.6, margin: "0 0 24px" }}>
                Connect your distribution channels and run an analysis. Signal will log every brief sent here.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <a
                  href="/settings/distribution"
                  className="btn-primary"
                  style={{ textDecoration: "none", fontSize: "0.875rem", padding: "9px 18px" }}
                >
                  Set up channels
                </a>
                <a
                  href="/dashboard"
                  style={{
                    textDecoration: "none", color: "var(--muted-light)", fontSize: "0.875rem",
                    padding: "9px 18px", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, background: "none",
                  }}
                >
                  Go to Signals
                </a>
              </div>
            </div>
          ) : (
            /* ── Delivery table ── */
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Channel", "Recipient", "Subject", "Sent", "Status"].map((h) => (
                    <th key={h} style={{
                      color: "var(--muted)", fontSize: "0.7rem", fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      padding: "12px 16px", textAlign: "left",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => {
                  const sc = statusColor(d.status);
                  return (
                    <tr
                      key={d.id}
                      style={{
                        borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: "0.95rem" }}>{channelIcon(d.channel)}</span>
                          <span style={{ color: "#fff", fontSize: "0.875rem", fontWeight: 500 }}>{channelLabel(d.channel)}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--muted)", fontSize: "0.8rem", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {d.recipient}
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--muted-light)", fontSize: "0.8rem", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {d.subject ?? `Brief for cluster ${d.cluster_id.slice(0, 8)}`}
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        {timeSince(d.sent_at)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "3px 10px", borderRadius: 9999, fontSize: "0.72rem", fontWeight: 600,
                          background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                        }}>
                          {d.status === "sent" ? "✓ " : d.status === "failed" ? "✕ " : "⏳ "}
                          {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {filtered.length > 0 && filtered.length < deliveries.length && (
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", textAlign: "center", marginTop: 16 }}>
            Showing {filtered.length} of {deliveries.length} deliveries
          </p>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
