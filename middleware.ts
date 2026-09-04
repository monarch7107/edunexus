import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { DEMO_COOKIE } from "./lib/session-cookie";

const PROTECTED = [
  "/dashboard",
  "/academics",
  "/planner",
  "/learning",
  "/insights",
  "/profile",
  "/onboarding",
];
const AUTH_PAGES = ["/login", "/register"];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p);

  // Demo mode: session is marked with a cookie set at sign-in.
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    const hasSession = request.cookies.has(DEMO_COOKIE);
    if (isProtected && !hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (isAuthPage && hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Supabase mode: refresh session, then guard routes.
  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/academics/:path*",
    "/planner/:path*",
    "/learning/:path*",
    "/insights/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
    "/login",
    "/register",
  ],
};
