import { NextResponse, type NextRequest } from "next/server";
import type { ProfileRole } from "@service-time/types";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type ProfileGate = {
  role: ProfileRole;
  redirectIfWrongRole: (role: ProfileRole | undefined) => string;
};

async function getActiveProfileRole(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
): Promise<ProfileRole | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.is_active || !profile.role) return null;
  return profile.role as ProfileRole;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createSupabaseServerClient({
    getAll() {
      return request.cookies.getAll();
    },
    setAll(cookiesToSet, headers) {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      cookiesToSet.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options),
      );
      if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const loginRedirect = (nextPath: string) => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", nextPath);
    return NextResponse.redirect(url);
  };

  const signOutAndLogin = async (nextPath = path) => {
    await supabase.auth.signOut();
    return loginRedirect(nextPath);
  };

  if ((path === "/login" || path === "/register") && user) {
    const role = await getActiveProfileRole(supabase, user.id);
    if (role) {
      const url = request.nextUrl.clone();
      url.pathname =
        role === "admin"
          ? "/admin"
          : role === "technician"
            ? "/technician"
            : "/client";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return signOutAndLogin("/login");
  }

  const roleGates: Array<{ prefix: string; gate: ProfileGate }> = [
    {
      prefix: "/admin",
      gate: {
        role: "admin",
        redirectIfWrongRole: (role) =>
          role === "technician" ? "/technician" : "/login",
      },
    },
    {
      prefix: "/technician",
      gate: {
        role: "technician",
        redirectIfWrongRole: (role) =>
          role === "admin" ? "/admin" : "/login",
      },
    },
    {
      prefix: "/client",
      gate: {
        role: "client",
        redirectIfWrongRole: (role) =>
          role === "admin"
            ? "/admin"
            : role === "technician"
              ? "/technician"
              : "/login",
      },
    },
  ];

  for (const { prefix, gate } of roleGates) {
    if (!path.startsWith(prefix)) continue;

    if (!user) {
      return loginRedirect(path);
    }

    const role = await getActiveProfileRole(supabase, user.id);
    if (!role) {
      return signOutAndLogin(path);
    }

    if (role !== gate.role) {
      const url = request.nextUrl.clone();
      url.pathname = gate.redirectIfWrongRole(role);
      return NextResponse.redirect(url);
    }

    break;
  }

  if (path === "/request" && user) {
    const role = await getActiveProfileRole(supabase, user.id);
    if (role && role !== "client") {
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/admin" : "/technician";
      return NextResponse.redirect(url);
    }
  }

  if (path === "/spare-parts/checkout") {
    if (!user) {
      return loginRedirect(path);
    }

    const role = await getActiveProfileRole(supabase, user.id);
    if (!role || role !== "client") {
      const url = request.nextUrl.clone();
      url.pathname =
        role === "admin"
          ? "/admin"
          : role === "technician"
            ? "/technician"
            : "/login";
      return NextResponse.redirect(url);
    }
  }

  if (user) {
    response.headers.set("Cache-Control", "private, no-store, must-revalidate");
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/technician/:path*",
    "/client/:path*",
    "/request",
    "/spare-parts/checkout",
    "/login",
    "/register",
  ],
};
