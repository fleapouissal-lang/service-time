import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import { downloadRequestPhoto } from "@/lib/request-photo";
import { canAccessServiceRequestPhotos } from "@/lib/service-request-photo-access";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestId = url.searchParams.get("requestId")?.trim();
  const photoId = url.searchParams.get("photoId")?.trim();
  const download = url.searchParams.get("download") === "1";

  if (!requestId || !photoId) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const profile = await requireProfile(["admin", "client", "technician"]);
  if (!profile) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!(await canAccessServiceRequestPhotos(profile, requestId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = getAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json({ error: "server_config" }, { status: 500 });
  }

  const { data: photo, error } = await admin
    .from("request_photos")
    .select("id, request_id, storage_path")
    .eq("id", photoId)
    .eq("request_id", requestId)
    .maybeSingle();

  if (error || !photo?.storage_path) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const file = await downloadRequestPhoto(photo.storage_path);
  if (!file) {
    return NextResponse.json({ error: "photo_not_found" }, { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", file.contentType);
  headers.set("Cache-Control", "private, max-age=3600");
  headers.set(
    "Content-Disposition",
    download
      ? `attachment; filename="${file.filename}"`
      : `inline; filename="${file.filename}"`,
  );

  return new NextResponse(file.buffer, { status: 200, headers });
}
