"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase-client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  // Supabase puts recovery token in URL hash — it auto-exchanges it into a session
  useEffect(() => {
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    // Timeout after 10s — if we didn't get PASSWORD_RECOVERY event, the link is invalid/expired
    const timeout = setTimeout(() => {
      if (!ready) {
        setError("This reset link has expired or is invalid. Please request a new one.");
        setReady(true); // show the form area (will show error)
      }
    }, 10000);
    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const { error: err } = await supabaseClient.auth.updateUser({ password });
      if (err) { setError(err.message); return; }
      router.push("/dashboard");
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
          <h1 style={{ color: "white", fontWeight: 700, fontSize: "1.25rem", margin: "0 0 6px" }}>Set new password</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 28px" }}>
            {ready ? "Choose a new password for your account." : "Loading your reset link…"}
          </p>

          {!ready ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
              <div style={{ width: 32, height: 32, border: "3px solid rgba(249,115,22,0.15)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem", marginBottom: 6 }}>New password</label>
                <input
                  className="obs-input"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem", marginBottom: 6 }}>Confirm password</label>
                <input
                  className="obs-input"
                  type="password"
                  placeholder="Same password again"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
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
                {loading ? "Updating…" : "Set new password →"}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
