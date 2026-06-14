import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/auth";
import { downloadProfileAvatar } from "@/lib/profile-avatar-download";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId")?.trim();

  if (!userId) {
    return NextResponse.json({ error: "missing_user_id" }, { status: 400 });
  }

  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json({ error: "server_config" }, { status: 500 });
  }

  const { data: requesterProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = requesterProfile?.role === "admin";
  if (user.id !== userId && !isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: profile, error } = await admin
    .from("profiles")
    .select("avatar_url, avatar_storage_path")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const avatar = await downloadProfileAvatar(admin, profile);
  if (!avatar) {
    return NextResponse.json({ error: "avatar_not_found" }, { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", avatar.contentType);
  headers.set("Cache-Control", "private, max-age=3600");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");

  return new NextResponse(new Uint8Array(avatar.buffer), { status: 200, headers });
}
