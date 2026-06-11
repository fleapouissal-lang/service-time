import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import { downloadQuickRequestPhoto } from "@/lib/quick-request-photo";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestId = url.searchParams.get("requestId")?.trim();
  const download = url.searchParams.get("download") === "1";

  if (!requestId) {
    return NextResponse.json({ error: "missing_request_id" }, { status: 400 });
  }

  const profile = await requireProfile(["admin", "client"]);
  if (!profile) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json({ error: "server_config" }, { status: 500 });
  }

  const { data: row, error } = await admin
    .from("quick_requests")
    .select("id, client_id, photo_storage_path")
    .eq("id", requestId)
    .maybeSingle();

  if (error || !row?.photo_storage_path) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (profile.role === "client" && row.client_id !== profile.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const photo = await downloadQuickRequestPhoto(row.photo_storage_path, row.id);
  if (!photo) {
    return NextResponse.json({ error: "photo_not_found" }, { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", photo.contentType);
  headers.set("Cache-Control", "private, max-age=3600");
  headers.set(
    "Content-Disposition",
    download
      ? `attachment; filename="${photo.filename}"`
      : `inline; filename="${photo.filename}"`,
  );

  return new NextResponse(photo.buffer, { status: 200, headers });
}
