"use client";
import Link from "next/link";

const sourceCards = [
  {
    icon: "⚡",
    name: "Slack",
    description: "Ingest signals from any channel. Distribute briefs to your product & engineering channels.",
    color: "#e879f9",
    bg: "rgba(232,121,249,0.08)",
    border: "rgba(232,121,249,0.2)",
  },
  {
    icon: "💬",
    name: "WhatsApp",
    description: "Receive customer feedback via WhatsApp. Push critical alerts to key stakeholders.",
    color: "#46e6a6",
    bg: "rgba(70,230,166,0.08)",
    border: "rgba(70,230,166,0.2)",
  },
  {
    icon: "✉️",
    name: "Email",
    description: "Parse support threads and sales emails. Deliver digest briefs to your team's inbox.",
    color: "#6ea8ff",
    bg: "rgba(110,168,255,0.08)",
    border: "rgba(110,168,255,0.2)",
  },
];

const steps = [
  { n: "01", title: "Connect Sources", desc: "Link Slack, WhatsApp, and Email with one-click OAuth." },
  { n: "02", title: "Ingest Signals", desc: "Observer pulls messages, threads, and feedback automatically." },
  { n: "03", title: "AI Analysis", desc: "Claude groups signals into ranked Intent Gaps with evidence." },
  { n: "04", title: "Distribute Briefs", desc: "Actionable briefs land in Slack, WhatsApp, and Email." },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0c10", position: "relative", overflow: "hidden" }}>
      {/* Radial gradients */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "50%", background: "radial-gradient(ellipse at top left, rgba(110,168,255,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "50%", background: "radial-gradient(ellipse at top right, rgba(167,139,250,0.10) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "80%", height: "40%", background: "radial-gradient(ellipse at bottom, rgba(70,230,166,0.07) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 48px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="brand-dot" />
            <span style={{ color: "white", fontWeight: 700, fontSize: "1rem" }}>Observer AI</span>
            <span style={{ color: "var(--muted)", fontSize: "0.75rem", padding: "2px 8px", background: "rgba(255,255,255,0.06)", borderRadius: 9999, border: "1px solid rgba(255,255,255,0.08)" }}>
              Product Execution Engine
            </span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/dashboard" className="btn-secondary" style={{ textDecoration: "none" }}>Dashboard</Link>
            <Link href="/connect" className="btn-primary" style={{ textDecoration: "none" }}>Get Started</Link>
          </div>
        </nav>

        {/* Hero */}
        <div style={{ textAlign: "center", padding: "100px 24px 80px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 9999, background: "rgba(70,230,166,0.1)", border: "1px solid rgba(70,230,166,0.25)", marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-green)", display: "inline-block" }} />
            <span style={{ color: "var(--accent-green)", fontSize: "0.8rem", fontWeight: 500 }}>Two-way signal intelligence</span>
          </div>

          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 800, color: "white", margin: "0 0 24px", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Know what to build next.<br />
            <span style={{ background: "linear-gradient(135deg, var(--accent-green), var(--accent-blue))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Always.
            </span>
          </h1>

          <p style={{ fontSize: "1.2rem", color: "var(--muted)", maxWidth: 600, margin: "0 auto 48px", lineHeight: 1.6 }}>
            Observer ingests every customer signal. Ranks what matters.
            Delivers decision briefs where your team already works.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/connect" className="btn-primary" style={{ textDecoration: "none", fontSize: "1rem", padding: "14px 32px" }}>
              Connect your stack →
            </Link>
            <Link href="/dashboard" className="btn-secondary" style={{ textDecoration: "none", fontSize: "1rem", padding: "14px 32px" }}>
              View dashboard
            </Link>
          </div>
        </div>

        {/* Source Cards */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 32 }}>
            Two-way integration
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {sourceCards.map((card) => (
              <div key={card.name} className="obs-card" style={{ padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: card.bg, border: `1px solid ${card.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
                    {card.icon}
                  </div>
                  <div>
                    <div style={{ color: "white", fontWeight: 600, fontSize: "1rem" }}>{card.name}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: "0.7rem", color: card.color, background: `${card.color}15`, padding: "1px 8px", borderRadius: 9999, border: `1px solid ${card.color}30` }}>Ingest</span>
                      <span style={{ fontSize: "0.7rem", color: card.color, background: `${card.color}15`, padding: "1px 8px", borderRadius: 9999, border: `1px solid ${card.color}30` }}>Distribute</span>
                    </div>
                  </div>
                </div>
                <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6, margin: "0 0 20px" }}>{card.description}</p>
                <Link href="/connect" style={{ color: card.color, fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}>
                  Connect {card.name} →
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>
          <h2 style={{ textAlign: "center", color: "white", fontSize: "2rem", fontWeight: 700, marginBottom: 12 }}>How it works</h2>
          <p style={{ textAlign: "center", color: "var(--muted)", marginBottom: 48 }}>Signal to decision in four steps.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
            {steps.map((step) => (
              <div key={step.n} style={{ textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(70,230,166,0.1)", border: "1px solid rgba(70,230,166,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--accent-green)", fontWeight: 700, fontSize: "0.875rem", fontFamily: "monospace" }}>
                  {step.n}
                </div>
                <div style={{ color: "white", fontWeight: 600, marginBottom: 8 }}>{step.title}</div>
                <div style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.5 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", padding: "40px 24px 100px" }}>
          <div className="obs-card" style={{ display: "inline-block", padding: "48px 64px", maxWidth: 560 }}>
            <h2 style={{ color: "white", fontSize: "1.75rem", fontWeight: 700, marginBottom: 12 }}>
              Stop guessing. Start shipping.
            </h2>
            <p style={{ color: "var(--muted)", marginBottom: 32, lineHeight: 1.6 }}>
              Connect your first channel in under 2 minutes. Observer starts finding gaps immediately.
            </p>
            <Link href="/connect" className="btn-primary" style={{ textDecoration: "none", fontSize: "1rem", padding: "14px 32px" }}>
              Start for free →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="brand-dot" style={{ width: 20, height: 20 }} />
            <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Observer AI</span>
          </div>
          <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Built with Claude · Powered by signal intelligence</span>
        </div>
      </div>
    </div>
  );
}
