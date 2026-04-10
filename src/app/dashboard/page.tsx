"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/layout/TopNav";
import { IntentSnapshotModal } from "@/components/IntentSnapshotModal";
import { supabaseClient } from "@/lib/supabase-client";
import type { Cluster, Workspace } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysLeft(isoDate?: string): number {
  if (!isoDate) return 0;
  return Math.max(0, Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86400000));
}

function primarySource(cluster: Cluster): string {
  const sb = cluster.source_breakdown ?? {};
  const entries = Object.entries(sb).sort((a, b) => b[1] - a[1]);
  return entries.length > 0 ? entries[0][0].toUpperCase() : "MIXED";
}

function extractTags(cluster: Cluster): string[] {
  const stopwords = new Set(["the","and","for","with","from","that","this","are","was","were","has","have","its","our","your","their","which","what","when","how","who"]);
  const text = `${cluster.title} ${cluster.business_case ?? ""}`;
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopwords.has(w))
    .slice(0, 3)
    .map((w) => w.replace(/\s+/g, "-"));
  return [...new Set(words)];
}

function severityLabel(s: number): "critical" | "high" | "medium" | "low" {
  if (s >= 80) return "critical";
  if (s >= 60) return "high";
  if (s >= 35) return "medium";
  return "low";
}

function urgencyLabel(s: number): string {
  if (s >= 80) return "This sprint";
  if (s >= 60) return "Next sprint";
  if (s >= 35) return "Backlog";
  return "Icebox";
}

function revenueImpact(business_case?: string): string {
  if (!business_case) return "Unknown";
  const bc = business_case.toLowerCase();
  if (bc.includes("critical") || bc.includes("revenue") || bc.includes("churn")) return "High — Revenue risk";
  if (bc.includes("enterprise") || bc.includes("scalab")) return "Medium — Enterprise";
  if (bc.includes("polish") || bc.includes("minor") || bc.includes("typo")) return "Low — Polish";
  return "Medium — Growth";
}

function countConnectedSources(workspace: Workspace | null): number {
  if (!workspace) return 0;
  let count = 0;
  if (workspace.slack_token) count++;
  if (workspace.gmail_token) count++;
  const ic = workspace.integrations_config;
  if (ic) {
    const keys = ["zendesk","intercom","jira","appstore","github","reddit"] as const;
    for (const k of keys) {
      if ((ic[k] as { enabled?: boolean })?.enabled) count++;
    }
  }
  return count;
}

function severityColor(sev: "critical" | "high" | "medium" | "low"): string {
  switch (sev) {
    case "critical": return "#ef4444";
    case "high":     return "#f97316";
    case "medium":   return "#f59e0b";
    default:         return "rgba(255,255,255,0.28)";
  }
}

function sourceChips(cluster: Cluster): Array<{ name: string; count: number }> {
  const sb = cluster.source_breakdown ?? {};
  return Object.entries(sb)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
}

// ── Score Ring (SVG arc) ──────────────────────────────────────────────────────

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = size * 0.375;
  const circ = 2 * Math.PI * r;
  const sev = severityLabel(score);
  const color = severityColor(sev);
  const offset = circ * (1 - score / 100);
  const cx = size / 2;
  const sw = size === 48 ? 3.5 : 3;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw} />
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={`${circ}`}
          strokeDashoffset={`${offset}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size === 48 ? "0.78rem" : "0.65rem",
        fontWeight: 800, color,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "-0.03em",
      }}>
        {score}
      </div>
    </div>
  );
}

// ── Pipeline Stepper ──────────────────────────────────────────────────────────

function PipelineStepper({ signalCount, clusterCount }: { signalCount: number; clusterCount: number }) {
  const steps = [
    { key: "ingest",  label: "Ingest",  count: signalCount },
    { key: "cluster", label: "Cluster", count: clusterCount },
    { key: "decide",  label: "Decide",  count: clusterCount },
    { key: "spec",    label: "Spec",    count: clusterCount > 0 ? 1 : 0 },
    { key: "measure", label: "Measure", count: clusterCount > 0 ? 1 : 0 },
  ];
  const activeIndex = clusterCount > 0 ? 1 : signalCount > 0 ? 0 : -1;

  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "10px 18px",
      display: "flex", alignItems: "center", gap: 0,
    }}>
      {steps.map((step, i) => {
        const state = i < activeIndex ? "ps-done" : i === activeIndex ? "ps-active" : "ps-pending";
        const badgeState = i < activeIndex ? "done" : i === activeIndex ? "active" : "pending";
        return (
          <React.Fragment key={step.key}>
            <div className={`pipeline-step ${state}`}>
              <span className={`step-badge ${badgeState}`}>
                {i < activeIndex ? "✓" : i + 1}
              </span>
              {step.label}
              {step.count > 0 && (
                <span style={{
                  color: "var(--muted)", fontSize: "0.7rem",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  ×{step.count}
                </span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 1,
                background: "linear-gradient(90deg, var(--border), transparent)",
                minWidth: 12, maxWidth: 36,
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── AI Insight Banner ─────────────────────────────────────────────────────────

function AIInsightBanner({ clusters, onClose }: { clusters: Cluster[]; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const insights = clusters.slice(0, 3).map((c) => {
    const sev = severityLabel(c.severity);
    const emoji = sev === "critical" ? "🔴" : sev === "high" ? "🟠" : "🟡";
    return {
      headline: `${emoji} ${sev.charAt(0).toUpperCase() + sev.slice(1)} priority signal detected`,
      detail: c.title,
      confidence: c.confidence,
      sev,
    };
  });
  if (insights.length === 0) return null;
  const current = insights[idx];

  return (
    <div className="ai-insight-banner">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        {/* Brain icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "rgba(249,115,22,0.1)",
          border: "1px solid rgba(249,115,22,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, fontSize: "1.1rem",
        }}>🧠</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span style={{
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
              color: "var(--accent)", textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              AI INSIGHT {idx + 1}/{insights.length}
            </span>
            <span style={{
              padding: "2px 7px", borderRadius: 4,
              background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.18)",
              fontSize: "0.62rem", fontWeight: 600, color: "var(--accent)",
            }}>
              {current.confidence}% confidence
            </span>
          </div>
          <p style={{ fontWeight: 600, fontSize: "0.92rem", color: "#fff", margin: "0 0 3px", lineHeight: 1.4 }}>
            {current.headline}
          </p>
          <p style={{ color: "var(--muted-light)", fontSize: "0.81rem", margin: 0, lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {current.detail}
          </p>
          {insights.length > 1 && (
            <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
              {insights.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} style={{
                  width: i === idx ? 18 : 5, height: 5, borderRadius: 3,
                  border: "none", cursor: "pointer", padding: 0,
                  background: i === idx ? "var(--accent)" : "rgba(255,255,255,0.16)",
                  transition: "all 0.2s",
                }} />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {idx < insights.length - 1 && (
            <button onClick={() => setIdx((i) => i + 1)} style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
              borderRadius: 7, color: "#fff", cursor: "pointer",
              width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1rem",
            }}>›</button>
          )}
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "var(--muted-dim)",
            cursor: "pointer", padding: "4px 6px", fontSize: "0.9rem",
            borderRadius: 5, lineHeight: 1,
          }}>✕</button>
        </div>
      </div>
    </div>
  );
}

// ── Signal Card ───────────────────────────────────────────────────────────────

function SignalCard({
  cluster, selected, onClick, staggerIndex,
}: {
  cluster: Cluster;
  selected: boolean;
  onClick: () => void;
  staggerIndex: number;
}) {
  const score = cluster.severity;
  const sev = severityLabel(score);
  const color = severityColor(sev);
  const chips = sourceChips(cluster);
  const staggerClass = `stagger-${Math.min(staggerIndex + 1, 8)}`;

  return (
    <div
      className={`signal-card sev-${sev} ${selected ? "selected" : ""} ${staggerClass}`}
      onClick={onClick}
      style={{ padding: "16px 18px 14px 20px", cursor: "pointer" }}
    >
      {/* Title — visual hero */}
      <h3 style={{
        margin: "0 0 10px",
        fontWeight: 700,
        fontSize: "0.96rem",
        lineHeight: 1.45,
        color: "#fff",
        letterSpacing: "-0.018em",
      }}>
        {cluster.title}
      </h3>

      {/* Source chips */}
      {chips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {chips.map(({ name, count }) => (
            <span key={name} style={{
              padding: "2px 7px", borderRadius: 4,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: "0.62rem", fontWeight: 600,
              color: "var(--muted)",
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              {name}<span style={{ opacity: 0.4, fontWeight: 400, marginLeft: 4 }}>{count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className={`badge badge-${sev}`}>{sev}</span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.67rem", color: "var(--muted)",
        }}>
          <span style={{ color: "rgba(255,255,255,0.72)", fontWeight: 600 }}>{cluster.evidence_count}</span> sig
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.67rem", color: "var(--muted)",
        }}>
          <span style={{ color, fontWeight: 700 }}>{cluster.confidence}%</span>
        </span>
        <span style={{
          marginLeft: "auto",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.65rem", color: "var(--muted-dim)",
        }}>
          {urgencyLabel(score)}
        </span>
      </div>

      {/* Confidence indicator — thin accent bar */}
      <div style={{
        marginTop: 11, height: 2, borderRadius: 1,
        background: "rgba(255,255,255,0.05)", overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${cluster.confidence}%`,
          background: color, opacity: 0.5, borderRadius: 1,
        }} />
      </div>
    </div>
  );
}

// ── Brief Section ─────────────────────────────────────────────────────────────

function BriefSection({
  number, label, accentColor, children,
}: {
  number: string;
  label: string;
  accentColor?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div style={{ height: 1, background: "var(--border)", margin: "0 18px" }} />
      <div style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
          <div style={{
            width: 2, height: 12, borderRadius: 1, flexShrink: 0,
            background: accentColor || "rgba(255,255,255,0.14)",
          }} />
          <span style={{
            fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em",
            color: "var(--muted)", textTransform: "uppercase",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {number} · {label}
          </span>
        </div>
        {children}
      </div>
    </>
  );
}

// ── Execution Brief ───────────────────────────────────────────────────────────

type ApprovalState = "pending" | "approved" | "rejected";

function ExecutionBrief({
  cluster, approval, onApprove, onReject, onViewFull,
}: {
  cluster: Cluster | null;
  approval: ApprovalState;
  onApprove: () => void;
  onReject: () => void;
  onViewFull: () => void;
}) {
  if (!cluster) {
    return (
      <div style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 14, padding: 32,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 12, minHeight: 320,
      }}>
        <div style={{
          width: 1, height: 40,
          background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.08), transparent)",
        }} />
        <p style={{
          color: "var(--muted-dim)", fontSize: "0.78rem", margin: 0,
          textAlign: "center", maxWidth: 160, lineHeight: 1.65,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          Select a signal<br />to open its brief
        </p>
      </div>
    );
  }

  const sev = severityLabel(cluster.severity);
  const color = severityColor(sev);
  const chips = sourceChips(cluster);
  const briefId = cluster.id.slice(-4).toUpperCase();

  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 14, overflow: "hidden",
    }}>
      {/* Document header */}
      <div style={{
        padding: "10px 18px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{
            fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em",
            color: "var(--muted-dim)", textTransform: "uppercase",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Intel Brief
          </span>
          <span style={{
            fontSize: "0.62rem", color: "rgba(255,255,255,0.18)",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            #{briefId}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className={`badge badge-${sev}`}>{sev}</span>
          <div style={{
            width: 5, height: 5, borderRadius: "50%", background: "#22c55e",
            animation: "pulse-dot 2s ease-in-out infinite",
          }} />
        </div>
      </div>

      {/* Score + title block */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 7, marginBottom: 10 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "2.6rem", fontWeight: 900, lineHeight: 0.9,
            color, letterSpacing: "-0.05em",
          }}>
            {cluster.severity}
          </span>
          <span style={{
            fontSize: "0.6rem", fontWeight: 600, color: "var(--muted-dim)",
            letterSpacing: "0.08em", textTransform: "uppercase", paddingBottom: 3,
          }}>
            / 100
          </span>
        </div>
        <h4 style={{
          margin: "0 0 18px", fontSize: "0.9rem", fontWeight: 700,
          color: "#fff", lineHeight: 1.5, letterSpacing: "-0.015em",
        }}>
          {cluster.title}
        </h4>
      </div>

      {/* 01 — Assessment */}
      <BriefSection number="01" label="Assessment" accentColor={color}>
        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted-light)", lineHeight: 1.65 }}>
          {cluster.recommended_action || "No assessment generated."}
        </p>
      </BriefSection>

      {/* 02 — Signal Data */}
      <BriefSection number="02" label="Signal Data">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{
              fontSize: "0.6rem", color: "var(--muted-dim)",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3,
            }}>
              Evidence
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "1.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.04em",
            }}>
              {cluster.evidence_count}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: "0.6rem", color: "var(--muted-dim)",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3,
            }}>
              Confidence
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "1.5rem", fontWeight: 800, color, letterSpacing: "-0.04em",
            }}>
              {cluster.confidence}%
            </div>
          </div>
        </div>
        {chips.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
            {chips.map(({ name, count }) => (
              <span key={name} style={{
                padding: "2px 7px", borderRadius: 4,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: "0.62rem", fontWeight: 600,
                color: "var(--muted)",
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>
                {name}<span style={{ opacity: 0.4, fontWeight: 400, marginLeft: 4 }}>{count}</span>
              </span>
            ))}
          </div>
        )}
        <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${cluster.confidence}%`, background: color, borderRadius: 2 }} />
        </div>
      </BriefSection>

      {/* 03 — Disposition */}
      <BriefSection number="03" label="Disposition">
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button
            className={`btn-approve ${approval === "approved" ? "approved" : ""}`}
            onClick={onApprove}
          >
            ✓ {approval === "approved" ? "Approved" : "Approve"}
          </button>
          <button
            className={`btn-reject ${approval === "rejected" ? "rejected" : ""}`}
            onClick={onReject}
          >
            ✕ {approval === "rejected" ? "Rejected" : "Reject"}
          </button>
        </div>
        <button
          onClick={onViewFull}
          style={{
            background: "none", border: "1px solid var(--border)",
            borderRadius: 8, color: "var(--accent)",
            fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
            padding: "8px 14px", width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "background 0.12s, border-color 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(249,115,22,0.06)";
            e.currentTarget.style.borderColor = "rgba(249,115,22,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          ↗ View Full Brief
        </button>
      </BriefSection>
    </div>
  );
}

// ── Status Strip ──────────────────────────────────────────────────────────────

function StatusStrip({
  clusters, signalCount, sourceCount, lastRun,
}: {
  clusters: Cluster[];
  signalCount: number;
  sourceCount: number;
  lastRun: Date | null;
}) {
  const criticalCount = clusters.filter((c) => severityLabel(c.severity) === "critical").length;
  const avgConf = clusters.length > 0
    ? Math.round(clusters.reduce((sum, c) => sum + c.confidence, 0) / clusters.length)
    : 0;

  function timeAgo(d: Date): string {
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }

  const items = [
    ...(sourceCount > 0 ? [{ label: "sources wired", value: sourceCount, color: "#f1f1f5" }] : []),
    { label: "signals", value: signalCount, color: "#f1f1f5" },
    { label: "clusters", value: clusters.length, color: "#f1f1f5" },
    ...(criticalCount > 0 ? [{ label: "critical", value: criticalCount, color: "#f87171" }] : []),
    ...(clusters.length > 0 ? [{ label: "avg confidence", value: `${avgConf}%`, color: "#f1f1f5" }] : []),
  ];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "0 16px", height: 38, marginBottom: 16,
      overflow: "hidden",
    }}>
      {/* Live dot */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingRight: 16, flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse-dot 2s ease-in-out infinite" }} />
        <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--muted-light)", letterSpacing: "0.02em" }}>
          Live
        </span>
      </div>

      <div style={{ width: 1, height: 16, background: "var(--border)", marginRight: 16, flexShrink: 0 }} />

      {/* Stats */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, flex: 1 }}>
        {items.map((item, i) => (
          <React.Fragment key={item.label}>
            {i > 0 && <div style={{ width: 1, height: 14, background: "var(--border)", margin: "0 12px", flexShrink: 0 }} />}
            <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexShrink: 0 }}>
              <span style={{
                fontSize: "0.82rem", fontWeight: 700,
                color: item.color,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "-0.02em",
              }}>
                {item.value}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--muted)", letterSpacing: "-0.01em" }}>
                {item.label}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Last run */}
      {lastRun && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, paddingLeft: 16, flexShrink: 0 }}>
          <div style={{ width: 1, height: 14, background: "var(--border)", marginRight: 4 }} />
          <span style={{ fontSize: "0.7rem", color: "var(--muted-dim)", fontFamily: "'JetBrains Mono', monospace" }}>
            Last run: {timeAgo(lastRun)}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loadingClusters, setLoadingClusters] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [signalCount, setSignalCount] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [approvals, setApprovals] = useState<Record<string, ApprovalState>>({});
  const [showInsightBanner, setShowInsightBanner] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<"all"|"critical"|"high"|"medium"|"low">("all");
  const [sortBy, setSortBy] = useState<"severity"|"evidence"|"confidence">("severity");
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [userInitials, setUserInitials] = useState("?");

  // Auth
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => { if (!res.ok) router.push("/login?redirect=/dashboard"); else setAuthChecked(true); })
      .catch(() => router.push("/login"));

    fetch("/api/workspace")
      .then((r) => r.json())
      .then((d) => { if (d.workspace) setWorkspace(d.workspace); })
      .catch(() => {});

    supabaseClient.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      const name = data.user?.user_metadata?.full_name ?? email;
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) setUserInitials((parts[0][0] + parts[1][0]).toUpperCase());
      else if (parts[0]) setUserInitials(parts[0].substring(0, 2).toUpperCase());
    }).catch(() => {});
  }, [router]);

  const fetchClusters = useCallback(async () => {
    const res = await fetch("/api/analyze");
    if (res.status === 401) { router.push("/login"); return; }
    const data = await res.json();
    const fetched: Cluster[] = data.clusters ?? [];
    setClusters(fetched);
    if (fetched.length > 0 && !selectedCluster) setSelectedCluster(fetched[0]);
    setLoadingClusters(false);
  }, [router, selectedCluster]);

  const fetchSignalCount = useCallback(async () => {
    const res = await fetch("/api/signals?limit=1");
    if (!res.ok) return;
    const data = await res.json();
    setSignalCount(data.total ?? 0);
  }, []);

  useEffect(() => {
    if (authChecked) { fetchClusters(); fetchSignalCount(); }
  }, [authChecked, fetchClusters, fetchSignalCount]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setUpgradeRequired(false);
    try {
      await Promise.allSettled([
        fetch("/api/ingest/slack",    { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }),
        fetch("/api/ingest/email",    { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }),
        fetch("/api/ingest/zendesk",  { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }),
        fetch("/api/ingest/intercom", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }),
        fetch("/api/ingest/jira",     { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }),
        fetch("/api/ingest/appstore", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }),
        fetch("/api/ingest/github",   { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }),
        fetch("/api/ingest/reddit",   { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }),
      ]);
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
      if (analyzeRes.status === 402) {
        const data = await analyzeRes.json();
        setUpgradeRequired(true);
        setUpgradeMessage(data.error ?? "Upgrade required");
        return;
      }
      await fetchClusters();
      await fetchSignalCount();
      setLastRun(new Date());
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredClusters = clusters
    .filter((c) => {
      if (severityFilter === "all") return true;
      return severityLabel(c.severity) === severityFilter;
    })
    .sort((a, b) => {
      if (sortBy === "evidence") return b.evidence_count - a.evidence_count;
      if (sortBy === "confidence") return b.confidence - a.confidence;
      return b.severity - a.severity; // default: severity
    });

  const plan = workspace?.plan ?? "trial";
  const polar_status = workspace?.polar_status;
  const trialDays = daysLeft(workspace?.trial_ends_at);
  const sourceCount = countConnectedSources(workspace);

  const filterCounts = {
    all: clusters.length,
    critical: clusters.filter((c) => severityLabel(c.severity) === "critical").length,
    high: clusters.filter((c) => severityLabel(c.severity) === "high").length,
    medium: clusters.filter((c) => severityLabel(c.severity) === "medium").length,
    low: clusters.filter((c) => severityLabel(c.severity) === "low").length,
  };

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 38, height: 38, border: "3px solid rgba(249,115,22,0.15)", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>Loading workspace...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <TopNav sourceCount={sourceCount} signalCount={signalCount} userInitials={userInitials} />

      {/* ── Plan banners ── */}
      {plan === "trial" && trialDays <= 7 && trialDays > 0 && (
        <div style={{
          background: "rgba(251,191,36,0.06)", borderBottom: "1px solid rgba(251,191,36,0.15)",
          padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        }}>
          <span style={{ color: "#fbbf24", fontSize: "0.82rem" }}>
            ⏳ Trial ends in <strong>{trialDays} day{trialDays !== 1 ? "s" : ""}</strong>
          </span>
          <Link href="/settings/billing" style={{ color: "#fbbf24", fontWeight: 600, fontSize: "0.82rem", textDecoration: "underline" }}>
            Upgrade →
          </Link>
        </div>
      )}
      {(plan === "expired" || (plan === "trial" && trialDays === 0)) && (
        <div style={{
          background: "rgba(239,68,68,0.06)", borderBottom: "1px solid rgba(239,68,68,0.15)",
          padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        }}>
          <span style={{ color: "#f87171", fontSize: "0.82rem" }}>🚫 Trial ended —</span>
          <Link href="/settings/billing" style={{ color: "#f87171", fontWeight: 600, fontSize: "0.82rem", textDecoration: "underline" }}>
            Upgrade to continue →
          </Link>
        </div>
      )}
      {polar_status === "past_due" && (
        <div style={{
          background: "rgba(239,68,68,0.06)", borderBottom: "1px solid rgba(239,68,68,0.15)",
          padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        }}>
          <span style={{ color: "#f87171", fontSize: "0.82rem" }}>⚡ Payment failed —</span>
          <a href="/api/billing/portal" style={{ color: "#f87171", fontWeight: 600, fontSize: "0.82rem", textDecoration: "underline" }}>
            Update billing →
          </a>
        </div>
      )}

      {/* ── Main ── */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
              Signals
            </h1>
            <p style={{ margin: "3px 0 0", color: "var(--muted-light)", fontSize: "0.86rem" }}>
              Clustered product intelligence from all connected sources
            </p>
          </div>
          <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
            <button className="btn-secondary" style={{ fontSize: "0.82rem", padding: "8px 14px" }}>
              ↓ Export
            </button>
            <button
              className="btn-primary"
              onClick={runAnalysis}
              disabled={analyzing}
              style={{ minWidth: 130 }}
            >
              {analyzing ? (
                <>
                  <span style={{
                    display: "inline-block", width: 13, height: 13,
                    border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff",
                    borderRadius: "50%", animation: "spin 0.6s linear infinite",
                    flexShrink: 0,
                  }} />
                  Analyzing...
                </>
              ) : (
                <>▶ Run Analysis</>
              )}
            </button>
          </div>
        </div>

        {/* Upgrade prompt */}
        {upgradeRequired && (
          <div style={{
            padding: "13px 18px", borderRadius: 10,
            background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.2)",
            display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
          }}>
            <span>🔒</span>
            <div style={{ flex: 1, color: "#fbbf24", fontSize: "0.875rem" }}>{upgradeMessage}</div>
            <Link href="/settings/billing" className="btn-primary" style={{ textDecoration: "none", fontSize: "0.8rem", padding: "7px 16px" }}>
              Upgrade to Pro →
            </Link>
          </div>
        )}

        {loadingClusters ? (
          /* ── Skeleton state ── */
          <div>
            {/* Status strip skeleton */}
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, height: 38, marginBottom: 16, overflow: "hidden" }}>
              <div className="skeleton" style={{ height: "100%" }} />
            </div>
            {/* Pipeline skeleton */}
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 18px", marginBottom: 16 }}>
              <div className="skeleton" style={{ height: 26, borderRadius: 8 }} />
            </div>
            {/* Cards skeleton */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
                    <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
                      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ width: "40%", height: 9, marginBottom: 8 }} />
                        <div className="skeleton" style={{ width: "80%", height: 13 }} />
                      </div>
                    </div>
                    <div className="skeleton" style={{ height: 9, marginBottom: 6 }} />
                    <div className="skeleton" style={{ width: "75%", height: 9 }} />
                  </div>
                ))}
              </div>
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, height: 320 }}>
                <div className="skeleton" style={{ height: "100%", borderRadius: 14 }} />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── AI Insight banner ── */}
            {showInsightBanner && clusters.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <AIInsightBanner clusters={clusters} onClose={() => setShowInsightBanner(false)} />
              </div>
            )}

            {/* ── Pipeline stepper ── */}
            <div style={{ marginBottom: 16 }}>
              <PipelineStepper signalCount={signalCount} clusterCount={clusters.length} />
            </div>

            {/* ── Empty state ── */}
            {clusters.length === 0 && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "80px 24px", gap: 20,
              }}>
                {/* Radar animation */}
                <div style={{ position: "relative", width: 80, height: 80 }}>
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    border: "1px solid rgba(249,115,22,0.15)",
                  }} />
                  <div style={{
                    position: "absolute", inset: 8, borderRadius: "50%",
                    border: "1px solid rgba(249,115,22,0.2)",
                  }} />
                  <div style={{
                    position: "absolute", inset: 20, borderRadius: "50%",
                    background: "rgba(249,115,22,0.08)",
                    border: "1.5px solid rgba(249,115,22,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.3rem",
                  }}>
                    📡
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <h3 style={{ margin: "0 0 8px", color: "#fff", fontSize: "1.1rem", fontWeight: 700 }}>
                    No signals yet
                  </h3>
                  <p style={{ margin: 0, color: "var(--muted-light)", fontSize: "0.875rem", lineHeight: 1.6, maxWidth: 400 }}>
                    Connect your data sources and run an analysis to surface clustered product intelligence.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {sourceCount === 0 ? (
                    <Link href="/connect" className="btn-primary" style={{ textDecoration: "none" }}>
                      → Connect your first source
                    </Link>
                  ) : (
                    <>
                      <button className="btn-primary" onClick={runAnalysis} disabled={analyzing}>
                        ▶ Run Analysis
                      </button>
                      <Link href="/connect" className="btn-secondary" style={{ textDecoration: "none" }}>
                        Add more sources
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}

            {clusters.length > 0 && (
              <>
                {/* Status strip */}
                <StatusStrip
                  clusters={clusters}
                  signalCount={signalCount}
                  sourceCount={sourceCount}
                  lastRun={lastRun}
                />

                {/* Filter + sort bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["all","critical","high","medium","low"] as const).map((f) => (
                      <button
                        key={f}
                        className={`filter-tab ${severityFilter === f ? "active" : ""}`}
                        onClick={() => setSeverityFilter(f)}
                      >
                        {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                        {filterCounts[f] > 0 && (
                          <span style={{
                            marginLeft: 4, fontSize: "0.65rem", fontWeight: 700,
                            color: severityFilter === f ? "var(--accent)" : "var(--muted-dim)",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>
                            {filterCounts[f]}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Sort control */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--muted)", letterSpacing: "0.02em" }}>Sort:</span>
                    {(["severity","evidence","confidence"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSortBy(s)}
                        style={{
                          padding: "4px 10px", borderRadius: 6, border: "none",
                          cursor: "pointer", fontSize: "0.72rem", fontWeight: 500,
                          background: sortBy === s ? "rgba(255,255,255,0.09)" : "none",
                          color: sortBy === s ? "#fff" : "var(--muted)",
                          transition: "all 0.12s",
                        }}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Two-column layout */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 16, alignItems: "start" }}>

                  {/* Signal cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                    {filteredClusters.length === 0 ? (
                      <div style={{
                        textAlign: "center", padding: "48px 24px",
                        color: "var(--muted-light)",
                        background: "var(--card)", border: "1px solid var(--border)",
                        borderRadius: 14, fontSize: "0.875rem",
                      }}>
                        No signals match this filter.
                      </div>
                    ) : (
                      filteredClusters.map((c, idx) => (
                        <SignalCard
                          key={c.id}
                          cluster={c}
                          selected={selectedCluster?.id === c.id}
                          onClick={() => setSelectedCluster(c)}
                          staggerIndex={idx}
                        />
                      ))
                    )}
                  </div>

                  {/* Execution Brief — sticky */}
                  <div style={{ position: "sticky", top: 66 }}>
                    <ExecutionBrief
                      cluster={selectedCluster}
                      approval={selectedCluster ? (approvals[selectedCluster.id] ?? "pending") : "pending"}
                      onApprove={() => {
                        if (selectedCluster) setApprovals((a) => ({ ...a, [selectedCluster.id]: "approved" }));
                      }}
                      onReject={() => {
                        if (selectedCluster) setApprovals((a) => ({ ...a, [selectedCluster.id]: "rejected" }));
                      }}
                      onViewFull={() => setSnapshotOpen(true)}
                    />
                  </div>

                </div>
              </>
            )}
          </>
        )}
      </div>

      <IntentSnapshotModal
        cluster={selectedCluster}
        open={snapshotOpen}
        onClose={() => setSnapshotOpen(false)}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
