"use client";
import Link from "next/link";

const trialFeatures = [
  "14 days free",
  "10 analysis runs",
  "All 8 signal sources",
  "Slack, Email & WhatsApp delivery",
  "No credit card required",
];

const proFeatures = [
  "Unlimited analysis runs",
  "All 8 signal sources",
  "Slack, Email & WhatsApp delivery",
  "Priority support",
  "Cancel anytime",
];

export default function PricingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0c10", position: "relative", overflow: "hidden" }}>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "60%", height: "60%", background: "radial-gradient(ellipse, rgba(110,168,255,0.07) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", top: "-5%", right: "-10%", width: "55%", height: "55%", background: "radial-gradient(ellipse, rgba(167,139,250,0.07) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div className="brand-dot" />
            <span style={{ color: "white", fontWeight: 700, fontSize: "1rem" }}>Signal</span>
          </Link>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/login" style={{ color: "var(--muted)", fontSize: "0.875rem", textDecoration: "none", padding: "8px 16px" }}>
              Login
            </Link>
            <Link href="/signup" className="btn-primary" style={{ textDecoration: "none", fontSize: "0.875rem" }}>
              Start free →
            </Link>
          </div>
        </nav>

        {/* Header */}
        <div style={{ textAlign: "center", padding: "80px 24px 56px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 9999, background: "rgba(70,230,166,0.08)", border: "1px solid rgba(70,230,166,0.2)", marginBottom: 32 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-green)", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ color: "var(--accent-green)", fontSize: "0.78rem", fontWeight: 500 }}>Simple, transparent pricing</span>
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, color: "white", margin: "0 0 16px", letterSpacing: "-0.03em" }}>
            Start free. Upgrade when<br />you see the value.
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1.1rem", maxWidth: 480, margin: "0 auto" }}>
            14-day trial with 10 analysis runs. No credit card required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 100px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* Free Trial */}
          <div style={{ padding: "36px 32px", borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ color: "var(--muted)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Free Trial</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ color: "white", fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.04em" }}>$0</span>
                <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>/ 14 days</span>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: 8, lineHeight: 1.5 }}>
                Everything you need to see if Signal fits your team. No commitment.
              </p>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 12 }}>
              {trialFeatures.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted)", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--accent-green)", fontSize: "0.9rem", flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/signup" style={{ display: "block", textAlign: "center", padding: "12px 24px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", color: "white", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600, background: "rgba(255,255,255,0.04)", transition: "background 0.2s" }}>
              Start Free Trial →
            </Link>
          </div>

          {/* Pro */}
          <div style={{ padding: "36px 32px", borderRadius: 20, background: "linear-gradient(135deg, rgba(70,230,166,0.07), rgba(110,168,255,0.07))", border: "1px solid rgba(70,230,166,0.25)", position: "relative", overflow: "hidden" }}>
            {/* Glow */}
            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "80%", height: 1, background: "linear-gradient(90deg, transparent, rgba(70,230,166,0.4), transparent)" }} />

            <div style={{ position: "absolute", top: 20, right: 20 }}>
              <span style={{ background: "rgba(70,230,166,0.15)", color: "var(--accent-green)", border: "1px solid rgba(70,230,166,0.3)", borderRadius: 9999, padding: "3px 10px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Most Popular
              </span>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ color: "var(--accent-green)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Pro</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ color: "white", fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.04em" }}>$49</span>
                <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>/ month</span>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: 8, lineHeight: 1.5 }}>
                For product teams that run on data. Unlimited runs, unlimited clarity.
              </p>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 12 }}>
              {proFeatures.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.85)", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--accent-green)", fontSize: "0.9rem", flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/signup" className="btn-primary" style={{ display: "block", textAlign: "center", textDecoration: "none", padding: "12px 24px", borderRadius: 10, fontSize: "0.9rem" }}>
              Get Started →
            </Link>
          </div>
        </div>

        {/* FAQ / reassurance */}
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 24px 100px", textAlign: "center" }}>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.7 }}>
            Billed monthly via Polar · Cancel anytime · No lock-in<br />
            Secure checkout · Works globally including Turkey
          </p>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "24px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="brand-dot" style={{ width: 18, height: 18 }} />
            <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Signal</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <Link href="/" style={{ color: "var(--muted)", fontSize: "0.8rem", textDecoration: "none" }}>Home</Link>
            <Link href="/login" style={{ color: "var(--muted)", fontSize: "0.8rem", textDecoration: "none" }}>Login</Link>
            <Link href="/signup" style={{ color: "var(--muted)", fontSize: "0.8rem", textDecoration: "none" }}>Sign up</Link>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
