"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase-client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !workspaceName) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create auth user
      const { data, error: signUpError } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setError("Signup failed — no user ID returned.");
        return;
      }

      // 2. Create workspace row (works even without confirmed session)
      const res = await fetch("/api/auth/signup-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, workspaceName }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Failed to create workspace.");
        return;
      }

      // 3. If no session yet, email confirmation is required — show check email state
      if (!data.session) {
        setCheckEmail(true);
        return;
      }

      // 4. Session exists (auto-confirmed) → go straight to onboarding
      router.push("/connect?step=1");
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
        setResendMessage("Confirmation email resent. Check your inbox.");
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
          {checkEmail ? (
            /* ── Check your email state ── */
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>✉️</div>
              <h1 style={{ color: "white", fontWeight: 700, fontSize: "1.25rem", margin: "0 0 12px" }}>
                Check your email
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6, margin: "0 0 4px" }}>
                We sent a confirmation link to
              </p>
              <p style={{ color: "white", fontWeight: 600, fontSize: "0.9rem", margin: "0 0 20px", wordBreak: "break-all" }}>
                {email}
              </p>
              <p style={{ color: "var(--muted)", fontSize: "0.8rem", lineHeight: 1.6, margin: "0 0 24px" }}>
                Click the link in that email to activate your account.
                Check your spam folder if you don&apos;t see it within a minute.
              </p>

              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", marginBottom: 12 }}
              >
                {resendLoading ? (
                  <>
                    <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#0b0c10", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                    Resending...
                  </>
                ) : "Resend confirmation email"}
              </button>

              {resendMessage && (
                <p style={{
                  fontSize: "0.8rem",
                  marginBottom: 16,
                  color: resendMessage.toLowerCase().includes("resent") || resendMessage.toLowerCase().includes("check")
                    ? "var(--accent-green)"
                    : "var(--danger)",
                }}>
                  {resendMessage}
                </p>
              )}

              <button
                onClick={() => { setCheckEmail(false); setError(""); setResendMessage(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "0.8rem", textDecoration: "underline", padding: 0 }}
              >
                Wrong email? Go back
              </button>
            </div>
          ) : (
            /* ── Signup form ── */
            <>
              <h1 style={{ color: "white", fontWeight: 700, fontSize: "1.25rem", margin: "0 0 6px" }}>Create your account</h1>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 28px" }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none" }}>Sign in →</Link>
              </p>

              <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem", marginBottom: 6 }}>
                    Work email
                  </label>
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

                <div>
                  <label style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem", marginBottom: 6 }}>
                    Password
                  </label>
                  <input
                    className="obs-input"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem", marginBottom: 6 }}>
                    Workspace name
                  </label>
                  <input
                    className="obs-input"
                    type="text"
                    placeholder="Acme Inc."
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    autoComplete="organization"
                    required
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                  <p style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: 4 }}>
                    Your team or company name
                  </p>
                </div>

                {error && (
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
                      Creating account...
                    </>
                  ) : "Create account →"}
                </button>
              </form>
            </>
          )}
        </div>

        {!checkEmail && (
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.75rem", marginTop: 20 }}>
            By signing up, you agree to our{" "}
            <Link href="/terms" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "underline" }}>Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "underline" }}>Privacy Policy</Link>.
          </p>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
