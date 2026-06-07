import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if ((path.startsWith("/admin") || path.startsWith("/technician")) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/admin") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_active || profile.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = profile?.role === "technician" ? "/technician" : "/login";
      return NextResponse.redirect(url);
    }
  }

  if (path.startsWith("/technician") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_active || profile.role !== "technician") {
      const url = request.nextUrl.clone();
      url.pathname = profile?.role === "admin" ? "/admin" : "/login";
      return NextResponse.redirect(url);
    }
  }

  if (path === "/request" && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.is_active && profile.role !== "client") {
      const url = request.nextUrl.clone();
      url.pathname =
        profile.role === "admin"
          ? "/admin"
          : profile.role === "technician"
            ? "/technician"
            : "/login";
      return NextResponse.redirect(url);
    }
  }

  if (path === "/spare-parts/checkout") {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_active || profile.role !== "client") {
      const url = request.nextUrl.clone();
      url.pathname =
        profile?.role === "admin"
          ? "/admin"
          : profile?.role === "technician"
            ? "/technician"
            : "/login";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/technician/:path*",
    "/request",
    "/spare-parts/checkout",
  ],
};
