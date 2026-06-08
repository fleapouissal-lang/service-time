import { NextResponse } from "next/server";
import {
  RESET_CODE_MAX_ATTEMPTS,
  hashResetCode,
  isValidResetCodeFormat,
  normalizeEmail,
} from "@/lib/password-reset";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { getProfileAvatarPublicUrl } from "@/lib/upload-profile-avatar";
import { resolveProfileNamesFromFields } from "@/lib/profile-names";

export async function POST(request: Request) {
  const admin = getAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: "إعدادات الخادم غير مكتملة." },
      { status: 503 },
    );
  }

  let body: { email?: string; code?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");
  const code = (body.code ?? "").trim();

  if (!email || !isValidResetCodeFormat(code)) {
    return NextResponse.json(
      { error: "أدخل البريد والرمز المكوّن من 6 أرقام." },
      { status: 400 },
    );
  }

  const { data: record, error } = await admin
    .from("client_verification_codes")
    .select(
      "id, user_id, phone, code_hash, attempts, expires_at, verified_at, avatar_storage_path",
    )
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !record) {
    return NextResponse.json(
      { error: "لم يتم طلب رمز لهذا البريد." },
      { status: 404 },
    );
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "انتهت صلاحية الرمز. اطلب رمزاً جديداً." },
      { status: 410 },
    );
  }

  if (record.attempts >= RESET_CODE_MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "تجاوزت عدد المحاولات." },
      { status: 429 },
    );
  }

  if (record.code_hash !== hashResetCode(email, code)) {
    await admin
      .from("client_verification_codes")
      .update({ attempts: record.attempts + 1 })
      .eq("id", record.id);

    return NextResponse.json(
      { error: "الرمز غير صحيح." },
      { status: 401 },
    );
  }

  const { data: authUser, error: authError } =
    await admin.auth.admin.getUserById(record.user_id);

  if (authError || !authUser.user) {
    return NextResponse.json(
      { error: "الحساب غير موجود." },
      { status: 404 },
    );
  }

  const meta = authUser.user.user_metadata ?? {};
  const fullNameAr =
    (meta.full_name_ar as string | undefined)?.trim() ||
    (meta.full_name as string | undefined)?.trim() ||
    authUser.user.email ||
    "عميل";
  const fullNameEn = (meta.full_name_en as string | undefined)?.trim() ?? "";
  const localizedNames = await resolveProfileNamesFromFields(
    fullNameAr,
    fullNameEn,
  );

  const { error: confirmError } = await admin.auth.admin.updateUserById(
    record.user_id,
    { email_confirm: true },
  );

  if (confirmError) {
    console.error("[register/verify] confirm:", confirmError);
    return NextResponse.json(
      { error: "تعذّr تفعيل الحساب." },
      { status: 500 },
    );
  }

  const avatarUrl =
    record.avatar_storage_path != null
      ? getProfileAvatarPublicUrl(admin, record.avatar_storage_path)
      : null;

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: record.user_id,
      full_name: localizedNames.full_name,
      full_name_ar: localizedNames.full_name_ar,
      full_name_en: localizedNames.full_name_en,
      phone: record.phone,
      role: "client",
      technician_type: null,
      is_active: true,
      avatar_url: avatarUrl,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    console.error("[register/verify] profile:", profileError);
    return NextResponse.json(
      { error: "تعذّr إنشاء الملف الشخصي." },
      { status: 500 },
    );
  }

  await admin
    .from("client_verification_codes")
    .update({ verified_at: new Date().toISOString() })
    .eq("id", record.id);

  await admin.from("client_verification_codes").delete().eq("id", record.id);

  return NextResponse.json({
    ok: true,
    message: "تم تفعيل حسابك بنجاح. يمكنك الآن طلب الخدمة.",
  });
}
