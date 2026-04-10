import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal – Product Execution Engine",
  description: "Know what to build next. Always. Signal ingests every customer signal, ranks what matters, and delivers decision briefs where your team already works.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
