"use client";
import { useState } from "react";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: err } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) { setError(err.message); return; }
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "60%", height: "40%", background: "radial-gradient(ellipse at top, rgba(249,115,22,0.05) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div className="brand-dot" />
            <span style={{ color: "white", fontWeight: 700, fontSize: "1.1rem" }}>Signal</span>
          </Link>
        </div>

        <div className="obs-card" style={{ padding: 36 }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: 16 }}>✉️</div>
              <h1 style={{ color: "white", fontWeight: 700, fontSize: "1.2rem", margin: "0 0 12px" }}>Check your email</h1>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6, margin: "0 0 24px" }}>
                We sent a password reset link to <strong style={{ color: "white" }}>{email}</strong>.
                <br />Check your inbox (and spam folder).
              </p>
              <Link href="/login" style={{ color: "var(--accent)", fontSize: "0.875rem", textDecoration: "none" }}>
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ color: "white", fontWeight: 700, fontSize: "1.25rem", margin: "0 0 6px" }}>Reset your password</h1>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 28px" }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem", marginBottom: 6 }}>Email</label>
                  <input
                    className="obs-input"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>

                {error && (
                  <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(255,92,122,0.1)", border: "1px solid rgba(255,92,122,0.25)", color: "var(--danger)", fontSize: "0.875rem" }}>
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
                  {loading ? "Sending..." : "Send reset link →"}
                </button>
              </form>

              <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.8rem", marginTop: 20, marginBottom: 0 }}>
                <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none", opacity: 0.75 }}>← Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
