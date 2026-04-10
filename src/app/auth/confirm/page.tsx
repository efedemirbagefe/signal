"use client";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase-client";

export default function AuthConfirmPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleConfirm = async () => {
      try {
        // Supabase puts the code in the URL query string (PKCE flow)
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const tokenHash = params.get("token_hash");
        const type = params.get("type") as "signup" | "recovery" | "email" | null;

        if (code) {
          // PKCE flow — exchange code for session
          const { error } = await supabaseClient.auth.exchangeCodeForSession(code);
          if (error) {
            setStatus("error");
            setMessage(error.message);
            return;
          }
        } else if (tokenHash && type) {
          // Token hash flow — verify OTP
          const { error } = await supabaseClient.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) {
            setStatus("error");
            setMessage(error.message);
            return;
          }
        } else {
          // No token params — maybe already confirmed, try to get session
          const { data } = await supabaseClient.auth.getSession();
          if (!data.session) {
            setStatus("error");
            setMessage("No confirmation token found. Please try signing in.");
            return;
          }
        }

        setStatus("success");
        // Full page redirect to dashboard so cookies are sent to middleware
        window.location.href = "/dashboard";
      } catch (err) {
        setStatus("error");
        setMessage((err as Error).message);
      }
    };

    handleConfirm();
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b0c10",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 16,
    }}>
      {status === "loading" && (
        <>
          <div style={{
            width: 32, height: 32,
            border: "3px solid rgba(255,255,255,0.1)",
            borderTopColor: "var(--accent-green)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Confirming your email…</p>
        </>
      )}
      {status === "success" && (
        <p style={{ color: "var(--accent-green)", fontSize: "0.9rem" }}>Confirmed! Redirecting…</p>
      )}
      {status === "error" && (
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--danger)", fontSize: "0.9rem", marginBottom: 16 }}>{message}</p>
          <a href="/login" style={{ color: "var(--accent-green)", fontSize: "0.875rem" }}>← Back to sign in</a>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
