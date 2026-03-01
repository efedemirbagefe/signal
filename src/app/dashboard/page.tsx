"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { SignalsTab } from "@/components/dashboard/SignalsTab";
import { ExecutionRealityTab } from "@/components/dashboard/ExecutionRealityTab";
import { IntentGapsTab } from "@/components/dashboard/IntentGapsTab";
import { IntentSnapshotModal } from "@/components/IntentSnapshotModal";
import type { Cluster } from "@/lib/types";

type Tab = "overview" | "signals" | "execution" | "gaps";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loadingClusters, setLoadingClusters] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [snapshotCluster, setSnapshotCluster] = useState<Cluster | null>(null);
  const [snapshotOpen, setSnapshotOpen] = useState(false);

  const fetchClusters = useCallback(async () => {
    const res = await fetch(`/api/analyze?workspaceId=${WORKSPACE_ID}`);
    const data = await res.json();
    setClusters(data.clusters ?? []);
    setLoadingClusters(false);
  }, []);

  useEffect(() => { fetchClusters(); }, [fetchClusters]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      // Ingest from all sources first (errors on individual sources don't block analysis)
      await Promise.allSettled([
        fetch("/api/ingest/slack",     { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: WORKSPACE_ID }) }),
        fetch("/api/ingest/email",     { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: WORKSPACE_ID }) }),
        fetch("/api/ingest/zendesk",   { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: WORKSPACE_ID }) }),
        fetch("/api/ingest/intercom",  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: WORKSPACE_ID }) }),
        fetch("/api/ingest/jira",      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: WORKSPACE_ID }) }),
        fetch("/api/ingest/appstore",  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: WORKSPACE_ID }) }),
        fetch("/api/ingest/github",    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: WORKSPACE_ID }) }),
        fetch("/api/ingest/reddit",    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: WORKSPACE_ID }) }),
      ]);
      // Then analyze
      await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: WORKSPACE_ID }),
      });
      await fetchClusters();
      setLastSynced(new Date());
    } finally {
      setAnalyzing(false);
    }
  };

  const openSnapshot = (cluster: Cluster) => {
    setSnapshotCluster(cluster);
    setSnapshotOpen(true);
  };

  const timeSince = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins === 1) return "1m ago";
    return `${mins}m ago`;
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "signals", label: "Signals" },
    { key: "execution", label: "Execution Reality" },
    { key: "gaps", label: "Intent Gaps" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0b0c10", position: "relative" }}>
      {/* Background gradients */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "40%", height: "40%", background: "radial-gradient(ellipse at top left, rgba(110,168,255,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: "40%", height: "40%", background: "radial-gradient(ellipse at top right, rgba(167,139,250,0.07) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "60%", height: "30%", background: "radial-gradient(ellipse at bottom, rgba(70,230,166,0.05) 0%, transparent 70%)" }} />
      </div>

      {/* Top Bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(11,12,16,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", gap: 20, height: 64 }}>
          {/* Brand */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div className="brand-dot" />
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1 }}>Observer AI</div>
              <div style={{ color: "var(--muted)", fontSize: "0.65rem", lineHeight: 1 }}>Product Reality Layer</div>
            </div>
          </Link>

          {/* Separator */}
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.1)" }} />

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, flex: 1 }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`pill-tab ${tab === t.key ? "active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
                {t.key === "gaps" && clusters.length > 0 && (
                  <span style={{ marginLeft: 6, fontSize: "0.65rem", background: "var(--accent-green)", color: "#0b0c10", borderRadius: 9999, padding: "1px 6px", fontWeight: 700 }}>
                    {clusters.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <span className="status-pill">
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-green)", animation: "pulse 2s infinite" }} />
              Last synced {timeSince(lastSynced)}
            </span>
            <Link href="/settings/integrations" className="btn-secondary" style={{ textDecoration: "none", fontSize: "0.8rem", padding: "6px 14px" }}>
              🔌 Integrations
            </Link>
            <Link href="/settings/distribution" className="btn-secondary" style={{ textDecoration: "none", fontSize: "0.8rem", padding: "6px 14px" }}>
              ⚙ Settings
            </Link>
            <button className="btn-primary" onClick={runAnalysis} disabled={analyzing} style={{ fontSize: "0.875rem" }}>
              {analyzing ? (
                <>
                  <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#0b0c10", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  Analyzing...
                </>
              ) : "▶ Run Analysis"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        {loadingClusters && tab === "overview" ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 48, height: 48, border: "3px solid rgba(70,230,166,0.2)", borderTopColor: "var(--accent-green)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <p style={{ color: "var(--muted)" }}>Loading intelligence...</p>
          </div>
        ) : (
          <>
            {tab === "overview" && (
              <OverviewTab
                clusters={clusters}
                onOpenSnapshot={openSnapshot}
                onRunAnalysis={runAnalysis}
                analyzing={analyzing}
              />
            )}
            {tab === "signals" && <SignalsTab />}
            {tab === "execution" && <ExecutionRealityTab clusters={clusters} onOpenSnapshot={openSnapshot} />}
            {tab === "gaps" && <IntentGapsTab clusters={clusters} onOpenSnapshot={openSnapshot} />}
          </>
        )}
      </div>

      {/* Intent Snapshot Modal */}
      <IntentSnapshotModal
        cluster={snapshotCluster}
        open={snapshotOpen}
        onClose={() => setSnapshotOpen(false)}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
