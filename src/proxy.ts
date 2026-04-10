import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  // Check for Supabase session cookie — it may be stored as a single cookie or chunked
  // Don't try to parse/validate the value here; real auth validation happens in API routes
  const hasCookie =
    req.cookies.get("sb-qegkrtedjjzoodbyuovj-auth-token") ||
    req.cookies.get("sb-qegkrtedjjzoodbyuovj-auth-token.0");

  if (!hasCookie) {
    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(req.nextUrl.pathname)}`, req.url)
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
