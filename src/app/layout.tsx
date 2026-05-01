import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal AI – Product Intelligence",
  description: "Know what to build next. Always. Signal AI ingests every customer signal, ranks what matters, and delivers decision briefs where your team already works.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer style={{
          textAlign: "center",
          padding: "14px 24px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          color: "rgba(255,255,255,0.18)",
          fontSize: "0.62rem",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.06em",
          background: "transparent",
        }}>
          An Observer Product
        </footer>
      </body>
    </html>
  );
}
