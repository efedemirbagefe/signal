"use client";
import { useState } from "react";
import { SeverityBadge, ConfidenceBar, SourcePill } from "@/components/ui/Badge";
import type { Cluster } from "@/lib/types";

interface OverviewTabProps {
  clusters: Cluster[];
  onOpenSnapshot: (cluster: Cluster) => void;
  onRunAnalysis: () => void;
  analyzing: boolean;
}

export function OverviewTab({ clusters, onOpenSnapshot, onRunAnalysis, analyzing }: OverviewTabProps) {
  const topCluster = clusters[0] ?? null;
  const [distributing, setDistributing] = useState(false);

  const distributeToSlack = async (cluster: Cluster) => {
    setDistributing(true);
    await fetch("/api/distribute/slack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clusterId: cluster.id }),
    });
    setDistributing(false);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>
      {/* Left: Today's Headline + Slack Preview */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Headline Card */}
        {topCluster ? (
          <div className="obs-card" style={{ padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ color: "var(--accent-green)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Today's Headline</span>
              <SeverityBadge severity={topCluster.severity_label} />
            </div>

            <h2 style={{ color: "white", fontSize: "1.3rem", fontWeight: 700, margin: "0 0 12px", lineHeight: 1.3 }}>
              {topCluster.title}
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.6, margin: "0 0 24px" }}>
              {topCluster.business_case}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, padding: 20, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Confidence</div>
                <ConfidenceBar value={topCluster.confidence} />
              </div>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Evidence</div>
                <div style={{ color: "white", fontWeight: 600, fontSize: "1.1rem" }}>{topCluster.evidence_count}</div>
                <div style={{ color: "var(--muted)", fontSize: "0.75rem" }}>signals</div>
              </div>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Revenue Risk</div>
                <div style={{ color: "var(--danger)", fontWeight: 600, fontSize: "1.1rem" }}>
                  {topCluster.severity >= 70 ? "High" : topCluster.severity >= 40 ? "Medium" : "Low"}
                </div>
              </div>
            </div>

            {topCluster.customer_quote && (
              <blockquote style={{ margin: "0 0 24px", borderLeft: "3px solid var(--accent-green)", paddingLeft: 16, color: "var(--muted)", fontStyle: "italic", fontSize: "0.875rem", lineHeight: 1.6 }}>
                "{topCluster.customer_quote}"
              </blockquote>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-primary" onClick={() => onOpenSnapshot(topCluster)}>
                Intent Snapshot
              </button>
              <button className="btn-secondary" onClick={() => distributeToSlack(topCluster)} disabled={distributing}>
                {distributing ? "Sharing..." : "⚡ Share to Slack"}
              </button>
            </div>
          </div>
        ) : (
          <div className="obs-card" style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>📡</div>
            <h3 style={{ color: "white", marginBottom: 12 }}>No signals yet</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: 24, lineHeight: 1.6 }}>
              Connect your Slack, Email, or WhatsApp to start ingesting signals,<br />then run analysis to detect Intent Gaps.
            </p>
            <button className="btn-primary" onClick={onRunAnalysis} disabled={analyzing}>
              {analyzing ? "Analyzing..." : "Run Analysis"}
            </button>
          </div>
        )}

        {/* Slack Preview Card */}
        {topCluster && (
          <div className="obs-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "white", fontWeight: 600, fontSize: "0.875rem" }}>Slack Brief Preview</span>
                <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>→ #product-intelligence</span>
              </div>
            </div>
            <div className="slack-preview" style={{ padding: "16px 20px", borderRadius: "0 8px 8px 0" }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: "#46e6a6", fontWeight: 700 }}>Observer AI</span>
                <span style={{ color: "#666", fontSize: "0.7rem", marginLeft: 8 }}>Today at {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div style={{ color: "#e0e0e0", lineHeight: 1.6, fontSize: "0.8rem" }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {topCluster.severity >= 70 ? "🔴" : topCluster.severity >= 40 ? "🟡" : "🟢"} Intent Gap · {topCluster.severity_label.toUpperCase()}
                </div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{topCluster.title}</div>
                <div style={{ color: "#9aa3b2", marginBottom: 10 }}>{topCluster.business_case}</div>
                <div style={{ color: "#9aa3b2", marginBottom: 12, fontSize: "0.75rem" }}>
                  Evidence: {topCluster.evidence_count} signals · Confidence: {Math.round(topCluster.confidence * 100)}%
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="chip-action" onClick={() => onOpenSnapshot(topCluster)}>Intent Snapshot</button>
                <button className="chip-action">Evidence</button>
                <button className="chip-action">What closes the gap fastest?</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Intent Gaps list */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ color: "white", fontWeight: 600, fontSize: "0.95rem", margin: 0 }}>Intent Gaps</h3>
          <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{clusters.length} detected</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {clusters.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: "0.875rem" }}>
              Run analysis to detect gaps
            </div>
          )}
          {clusters.map((cluster, i) => (
            <div
              key={cluster.id}
              className="obs-card"
              style={{ padding: 16, cursor: "pointer", transition: "border-color 0.2s" }}
              onClick={() => onOpenSnapshot(cluster)}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(70,230,166,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(70,230,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-green)", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0 }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <span style={{ color: "white", fontWeight: 500, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cluster.title}</span>
                    <SeverityBadge severity={cluster.severity_label} className="flex-shrink-0" />
                  </div>
                  <ConfidenceBar value={cluster.confidence} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <SourcePill source="slack" count={cluster.source_breakdown.slack} />
                    {cluster.source_breakdown.email > 0 && <SourcePill source="email" count={cluster.source_breakdown.email} />}
                    {cluster.source_breakdown.whatsapp > 0 && <SourcePill source="whatsapp" count={cluster.source_breakdown.whatsapp} />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
