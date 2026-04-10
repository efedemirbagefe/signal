"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase-client";
import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailNotConfirmed(false);
    setResendMessage("");
    setLoading(true);

    try {
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes("Email not confirmed")) {
          setEmailNotConfirmed(true);
        } else {
          setError(signInError.message);
        }
        return;
      }

      // Full page redirect to ensure cookies are sent with the next request to middleware
      const raw = searchParams.get("redirect") ?? "/dashboard";
      // Only allow relative paths starting with / followed by a letter (blocks //, /\, protocol-relative)
      const redirectTo = /^\/[a-zA-Z]/.test(raw) ? raw : "/dashboard";
      window.location.href = redirectTo;
    } catch (err) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage("");
    try {
      const { error } = await supabaseClient.auth.resend({
        type: "signup",
        email,
      });
      if (error) {
        setResendMessage(error.message);
      } else {
        setResendMessage("Confirmation email sent. Check your inbox.");
      }
    } catch (err) {
      setResendMessage((err as Error).message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      {/* Background accent */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "60%", height: "40%", background: "radial-gradient(ellipse at top, rgba(249,115,22,0.05) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440, padding: "0 24px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div className="brand-dot" />
            <span style={{ color: "white", fontWeight: 700, fontSize: "1.1rem" }}>Signal</span>
          </Link>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: 8, marginBottom: 0 }}>
            Your product team&apos;s reality check.
          </p>
        </div>

        {/* Card */}
        <div className="obs-card animate-slide-up" style={{ padding: 36 }}>
          <h1 style={{ color: "white", fontWeight: 700, fontSize: "1.25rem", margin: "0 0 6px" }}>Welcome back</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 28px" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: "var(--accent)", textDecoration: "none" }}>Sign up free →</Link>
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem", marginBottom: 6 }}>
                Email
              </label>
              <input
                className="obs-input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailNotConfirmed(false); setError(""); }}
                autoComplete="email"
                required
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem" }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ color: "var(--accent)", fontSize: "0.75rem", textDecoration: "none", opacity: 0.75 }}>
                  Forgot password?
                </Link>
              </div>
              <input
                className="obs-input"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>

            {/* Email not confirmed — amber warning */}
            {emailNotConfirmed && (
              <div style={{
                padding: "14px 16px",
                borderRadius: 8,
                background: "rgba(255,209,102,0.08)",
                border: "1px solid rgba(255,209,102,0.25)",
              }}>
                <p style={{ color: "#ffd166", fontWeight: 500, margin: "0 0 6px", fontSize: "0.875rem" }}>
                  Please confirm your email before signing in.
                </p>
                <p style={{ color: "var(--muted)", margin: "0 0 12px", fontSize: "0.8rem" }}>
                  Check your inbox for the confirmation link we sent to{" "}
                  <strong style={{ color: "white" }}>{email}</strong>.
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  style={{
                    background: "rgba(255,209,102,0.12)",
                    border: "1px solid rgba(255,209,102,0.3)",
                    borderRadius: 6,
                    color: "#ffd166",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    padding: "6px 14px",
                    cursor: resendLoading ? "not-allowed" : "pointer",
                    opacity: resendLoading ? 0.6 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {resendLoading ? (
                    <>
                      <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,209,102,0.3)", borderTopColor: "#ffd166", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                      Sending...
                    </>
                  ) : "Resend confirmation email"}
                </button>
                {resendMessage && (
                  <p style={{
                    fontSize: "0.78rem",
                    marginTop: 8,
                    marginBottom: 0,
                    color: resendMessage.toLowerCase().includes("sent") || resendMessage.toLowerCase().includes("check")
                      ? "var(--accent-green)"
                      : "var(--danger)",
                  }}>
                    {resendMessage}
                  </p>
                )}
              </div>
            )}

            {/* Generic error — only for non-confirmation errors */}
            {error && !emailNotConfirmed && (
              <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(255,92,122,0.1)", border: "1px solid rgba(255,92,122,0.25)", color: "var(--danger)", fontSize: "0.875rem" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
            >
              {loading ? (
                <>
                  <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#0b0c10", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  Signing in...
                </>
              ) : "Sign in →"}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0b0c10" }} />}>
      <LoginContent />
    </Suspense>
  );
}
