"use client";
import Link from "next/link";

// ── Static data ───────────────────────────────────────────────────────────────

const sources = [
  "Zendesk", "Intercom", "GitHub", "App Store",
  "Reddit", "Jira", "Slack", "Gmail",
];

const analysisLines = [
  { src: "zendesk",  count: "34", unit: "tickets",  fill: 7 },
  { src: "appstore", count: "19", unit: "reviews",  fill: 5 },
  { src: "reddit",   count: "12", unit: "posts",    fill: 4 },
  { src: "github",   count: "8",  unit: "issues",   fill: 3 },
  { src: "intercom", count: "6",  unit: "convos",   fill: 2 },
];

const gaps = [
  {
    score: 94, sev: "critical",
    title: "Search latency killing trial conversions",
    evidence: "23 signals · Zendesk, Reddit, GitHub",
    rec: "Fix ES index refresh rate on free tier before next cohort",
    conf: 94,
  },
  {
    score: 78, sev: "high",
    title: "Mobile onboarding drops at step 3",
    evidence: "53 signals · App Store, Intercom",
    rec: "Simplify permissions screen, add progress indicators",
    conf: 88,
  },
  {
    score: 71, sev: "high",
    title: "API rate limits blocking enterprise deals",
    evidence: "22 signals · GitHub, Jira, Slack",
    rec: "Introduce tiered limits with burst allowance for enterprise",
    conf: 82,
  },
];

const proof = [
  { n: "8",   label: "Signal sources" },
  { n: "<2m", label: "Time to first insight" },
  { n: "0",   label: "New packages to install" },
  { n: "∞",   label: "Gaps you'll never miss" },
];

const steps = [
  {
    n: "01", title: "Connect",
    body: "Paste your API keys once. Signal wires into Zendesk, GitHub, App Store, Reddit, Intercom, Jira, Slack, and Gmail simultaneously.",
  },
  {
    n: "02", title: "Ingest",
    body: "Every source pulls on schedule. Thousands of data points processed without manual tagging, routing, or review.",
  },
  {
    n: "03", title: "Analyze",
    body: "Claude reads everything and clusters signals into ranked gaps — each with evidence count, severity score, and a recommended action.",
  },
  {
    n: "04", title: "Decide",
    body: "You receive a brief, not a dashboard. Approve or reject each gap. Ship the brief to Slack, email your team, or let Signal handle distribution.",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function sevColor(sev: string): string {
  if (sev === "critical") return "#ef4444";
  if (sev === "high") return "#f97316";
  return "#f59e0b";
}

// ── Mini SVG score ring ───────────────────────────────────────────────────────

function MiniRing({ score, sev }: { score: number; sev: string }) {
  const r = 13;
  const circ = 2 * Math.PI * r;
  const color = sevColor(sev);
  const offset = circ * (1 - score / 100);
  return (
    <div style={{ position: "relative", width: 34, height: 34, flexShrink: 0 }}>
      <svg width="34" height="34" viewBox="0 0 34 34" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="17" cy="17" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
        <circle
          cx="17" cy="17" r={r} fill="none"
          stroke={color} strokeWidth="2.5"
          strokeDasharray={String(circ)} strokeDashoffset={String(offset)}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.6rem", fontWeight: 800, color,
        fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em",
      }}>
        {score}
      </div>
    </div>
  );
}

// ── Signal card (static preview) ─────────────────────────────────────────────

function PreviewCard({ gap }: { gap: typeof gaps[0] }) {
  const color = sevColor(gap.sev);
  return (
    <div style={{
      background: "#0e0e13",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      padding: "14px 16px 14px 18px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Left severity bar */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 3, background: color }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <MiniRing score={gap.score} sev={gap.sev} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{
              fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em",
              color: "#5a5a7a", textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {gap.evidence.split("·")[1]?.trim().split(",")[0] ?? "MIXED"}
            </span>
            <span style={{
              fontSize: "0.6rem", fontWeight: 700,
              color: gap.sev === "critical" ? "#f87171" : "#fb923c",
              background: gap.sev === "critical" ? "rgba(239,68,68,0.1)" : "rgba(249,115,22,0.1)",
              border: `1px solid ${gap.sev === "critical" ? "rgba(239,68,68,0.2)" : "rgba(249,115,22,0.2)"}`,
              padding: "1px 6px", borderRadius: 4,
            }}>
              {gap.sev}
            </span>
          </div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "#f1f1f5", lineHeight: 1.4 }}>
            {gap.title}
          </p>
        </div>
      </div>

      <div style={{
        background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.14)",
        borderRadius: 8, padding: "10px 12px",
      }}>
        <p style={{ margin: "0 0 8px", fontSize: "0.78rem", color: "#9090b0", lineHeight: 1.5 }}>
          → {gap.rec}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ height: 3, flex: 1, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${gap.conf}%`, background: "linear-gradient(90deg, #f97316, #fb923c)", borderRadius: 2 }} />
          </div>
          <span style={{
            fontSize: "0.65rem", fontWeight: 700, color: "#f97316",
            fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
          }}>
            {gap.conf}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#06060a", color: "#f1f1f5", fontFamily: "inherit" }}>

      {/* ── Nav ── */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 40px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="9.5" stroke="#f97316" strokeWidth="1.2" opacity="0.45" />
            <path d="M3 11C5 7 7.8 5 11 5C14.2 5 17 7 19 11C17 15 14.2 17 11 17C7.8 17 5 15 3 11Z"
              stroke="#f97316" strokeWidth="1.1" fill="none" opacity="0.6" />
            <circle cx="11" cy="11" r="2.8" fill="#f97316" />
            <circle cx="12.3" cy="9.7" r="0.9" fill="rgba(255,255,255,0.55)" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: "0.93rem", letterSpacing: "-0.02em", color: "#f1f1f5" }}>
            signal
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Link href="/pricing" style={{
            color: "#6a6a8a", fontSize: "0.875rem", textDecoration: "none",
            padding: "7px 14px", borderRadius: 7,
          }}>
            Pricing
          </Link>
          <Link href="/login" style={{
            color: "#6a6a8a", fontSize: "0.875rem", textDecoration: "none",
            padding: "7px 14px", borderRadius: 7,
          }}>
            Sign in
          </Link>
          <Link href="/signup" style={{
            background: "#f97316", color: "#fff",
            fontSize: "0.875rem", fontWeight: 600, textDecoration: "none",
            padding: "8px 18px", borderRadius: 8,
            display: "inline-flex", alignItems: "center", gap: 6,
            boxShadow: "0 2px 12px rgba(249,115,22,0.3)",
          }}>
            Start free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "88px 40px 100px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>

          {/* Left — editorial */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 28 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
              <span style={{
                fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#5a5a7a",
              }}>
                9 sources · Claude-powered · Ships in minutes
              </span>
            </div>

            <h1 style={{
              fontSize: "clamp(2.8rem, 5vw, 4.4rem)",
              fontWeight: 800, lineHeight: 1.03,
              letterSpacing: "-0.04em",
              margin: "0 0 24px", color: "#f1f1f5",
            }}>
              Stop guessing<br />
              what to build<br />
              <span style={{ color: "#f97316" }}>next.</span>
            </h1>

            <p style={{
              fontSize: "1.05rem", color: "#6a6a8a", lineHeight: 1.68,
              margin: "0 0 40px", maxWidth: 460,
            }}>
              Signal reads every signal your users send — support tickets, app reviews, GitHub issues, community posts — and tells your team exactly where to focus.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <Link href="/signup" style={{
                background: "#f97316", color: "#fff",
                fontSize: "0.975rem", fontWeight: 600, textDecoration: "none",
                padding: "12px 28px", borderRadius: 10,
                display: "inline-flex", alignItems: "center", gap: 7,
                boxShadow: "0 2px 16px rgba(249,115,22,0.32)",
              }}>
                Start free →
              </Link>
              <Link href="/login" style={{
                color: "#6a6a8a", fontSize: "0.9rem", textDecoration: "none",
                padding: "12px 20px", borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
              }}>
                Sign in
              </Link>
            </div>
            <p style={{ color: "#3a3a52", fontSize: "0.76rem", margin: 0 }}>
              No credit card · First workspace free · Cancel anytime
            </p>
          </div>

          {/* Right — product preview */}
          <div>
            {/* Analysis terminal */}
            <div style={{
              background: "#0c0c11",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, overflow: "hidden", marginBottom: 10,
              boxShadow: "0 24px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.035) inset",
            }}>
              {/* Window chrome */}
              <div style={{
                padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", gap: 7,
                background: "rgba(255,255,255,0.015)",
              }}>
                {[0.08, 0.06, 0.04].map((op, i) => (
                  <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: `rgba(255,255,255,${op})` }} />
                ))}
                <span style={{
                  marginLeft: 10, fontSize: "0.67rem", color: "#3a3a52",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  $ signal analyze --workspace acme
                </span>
              </div>

              {/* Terminal body */}
              <div style={{ padding: "16px 18px", fontFamily: "'JetBrains Mono', monospace" }}>
                <div style={{ fontSize: "0.7rem", color: "#3a3a52", marginBottom: 14 }}>
                  Pulling signals from 5 sources...
                </div>
                {analysisLines.map((line) => (
                  <div key={line.src} style={{
                    display: "flex", alignItems: "center", gap: 10, marginBottom: 7,
                  }}>
                    <span style={{ fontSize: "0.68rem", color: "#22c55e", width: 12 }}>✓</span>
                    <span style={{ fontSize: "0.68rem", color: "#6a6a8a", width: 64 }}>{line.src}</span>
                    <span style={{ fontSize: "0.68rem", color: "#c0c0d8", width: 70 }}>
                      {line.count} {line.unit}
                    </span>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[...Array(8)].map((_, i) => (
                        <div key={i} style={{
                          width: 5, height: 5, borderRadius: 1,
                          background: i < line.fill ? "#f97316" : "rgba(255,255,255,0.05)",
                        }} />
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "12px 0" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.68rem", color: "#22c55e" }}>✦</span>
                  <span style={{
                    fontSize: "0.7rem", fontWeight: 600, color: "#f1f1f5",
                  }}>
                    79 signals · 3 gaps identified
                  </span>
                </div>
              </div>
            </div>

            {/* First signal card */}
            <PreviewCard gap={gaps[0]} />
          </div>
        </div>
      </div>

      {/* ── Sources strip ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{
          maxWidth: 1160, margin: "0 auto", padding: "18px 40px",
          display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
        }}>
          <span style={{
            fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#3a3a52", flexShrink: 0,
          }}>
            Works with
          </span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {sources.map((src) => (
              <span key={src} style={{
                padding: "4px 12px", borderRadius: 20,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
                fontSize: "0.78rem", fontWeight: 500, color: "#6a6a8a",
              }}>
                {src}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Problem statement ── */}
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "100px 40px" }}>
        <p style={{
          fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "#3a3a52", marginBottom: 28,
        }}>
          The problem
        </p>
        <h2 style={{
          fontSize: "clamp(1.75rem, 3.5vw, 2.8rem)",
          fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.15,
          margin: "0 0 28px", color: "#f1f1f5",
        }}>
          Your backlog is full of opinions,<br />not evidence.
        </h2>
        <p style={{ fontSize: "1rem", color: "#6a6a8a", lineHeight: 1.72, margin: "0 0 18px", maxWidth: 600 }}>
          Product teams spend hours triaging support tickets, scanning community posts, and reading app store reviews — manually, one tab at a time. The signal is there. The problem is synthesis.
        </p>
        <p style={{ fontSize: "1rem", color: "#6a6a8a", lineHeight: 1.72, margin: 0, maxWidth: 600 }}>
          Signal reads every channel your customers use and clusters the signal into ranked, evidence-backed gaps — with a recommended action and a confidence score. In under two minutes.
        </p>
      </div>

      {/* ── How it works ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "80px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>

            {/* Left — steps */}
            <div>
              <p style={{
                fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "#3a3a52", marginBottom: 40,
              }}>
                How it works
              </p>
              {steps.map((step) => (
                <div key={step.n} style={{ display: "flex", gap: 18, marginBottom: 34 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    fontSize: "0.62rem", fontWeight: 700, color: "#3a3a52",
                    fontFamily: "'JetBrains Mono', monospace",
                    marginTop: 2,
                  }}>
                    {step.n}
                  </div>
                  <div>
                    <div style={{
                      fontWeight: 700, fontSize: "0.93rem", color: "#f1f1f5", marginBottom: 7,
                    }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#6a6a8a", lineHeight: 1.68 }}>
                      {step.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right — sample output */}
            <div>
              <p style={{
                fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "#3a3a52", marginBottom: 16,
              }}>
                Sample output
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {gaps.map((gap) => (
                  <PreviewCard key={gap.title} gap={gap} />
                ))}
              </div>
              <p style={{ fontSize: "0.72rem", color: "#3a3a52", marginTop: 14, fontFamily: "'JetBrains Mono', monospace" }}>
                ↑ Real output format · Generated by Claude · From your actual stack
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* ── Proof numbers ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
            {proof.map((p, i) => (
              <div key={p.n} style={{
                padding: "48px 40px",
                borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}>
                <div style={{
                  fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.045em",
                  color: "#f1f1f5",
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: 10, lineHeight: 1,
                }}>
                  {p.n}
                </div>
                <div style={{ fontSize: "0.84rem", color: "#6a6a8a", lineHeight: 1.5 }}>
                  {p.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Final CTA ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "100px 40px 120px" }}>
          <p style={{
            fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#3a3a52", marginBottom: 24,
          }}>
            Get started
          </p>
          <h2 style={{
            fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)",
            fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08,
            margin: "0 0 36px", color: "#f1f1f5", maxWidth: 640,
          }}>
            Your next sprint<br />should be obvious.
          </h2>
          <Link href="/signup" style={{
            background: "#f97316", color: "#fff",
            fontSize: "1rem", fontWeight: 600, textDecoration: "none",
            padding: "13px 32px", borderRadius: 10,
            display: "inline-flex", alignItems: "center", gap: 8,
            boxShadow: "0 2px 18px rgba(249,115,22,0.32)",
          }}>
            Start free →
          </Link>
          <p style={{ color: "#3a3a52", fontSize: "0.78rem", marginTop: 18 }}>
            First workspace free · No credit card required · Cancel anytime
          </p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "20px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="9.5" stroke="#f97316" strokeWidth="1.2" opacity="0.35" />
            <circle cx="11" cy="11" r="3.5" fill="#f97316" opacity="0.5" />
          </svg>
          <span style={{ color: "#3a3a52", fontSize: "0.82rem" }}>signal</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {[["Pricing", "/pricing"], ["Login", "/login"], ["Sign up", "/signup"], ["Terms", "/terms"], ["Privacy", "/privacy"]].map(([label, href]) => (
            <Link key={href} href={href} style={{ color: "#3a3a52", fontSize: "0.78rem", textDecoration: "none" }}>
              {label}
            </Link>
          ))}
        </div>
        <span style={{ color: "#22222e", fontSize: "0.72rem" }}>Powered by Claude · Made for product teams</span>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .how-grid { grid-template-columns: 1fr !important; }
          .proof-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
