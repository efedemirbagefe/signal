import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase instance using @supabase/ssr.
// createBrowserClient automatically reads/writes HTTP cookies (not just localStorage)
// so session tokens are visible to Next.js middleware and server-side API routes.
export const supabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: "implicit", // avoids PKCE code verifier storage issues across tabs/devices
    },
  }
);
