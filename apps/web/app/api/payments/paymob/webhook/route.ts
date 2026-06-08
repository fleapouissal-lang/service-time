import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { amountToHalalas } from "@/lib/paymob";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

type PaymobTransactionPayload = {
  type?: string;
  obj?: {
    id?: number;
    success?: boolean;
    amount_cents?: number;
    currency?: string;
    order?: {
      id?: number;
      merchant_order_id?: string;
    };
    payment_key_claims?: {
      extra?: {
        special_reference?: string;
      };
    };
  };
};

function verifyPaymobHmac(obj: Record<string, unknown>, receivedHmac: string): boolean {
  const secret = process.env.PAYMOB_HMAC_SECRET?.trim();
  if (!secret || !receivedHmac) {
    return false;
  }

  const sourceData = (obj.source_data as Record<string, unknown> | undefined) ?? {};
  const order = (obj.order as Record<string, unknown> | undefined) ?? {};

  const parts = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    order.id,
    obj.owner,
    obj.pending,
    sourceData.pan,
    sourceData.sub_type,
    sourceData.type,
    obj.success,
  ];

  const digest = createHmac("sha512", secret)
    .update(parts.map((value) => String(value ?? "")).join(""))
    .digest("hex");

  return digest === receivedHmac;
}

function extractOrderId(payload: PaymobTransactionPayload): string | null {
  const specialReference =
    payload.obj?.payment_key_claims?.extra?.special_reference ??
    payload.obj?.order?.merchant_order_id;
  return specialReference ?? null;
}

export async function POST(request: Request) {
  const hmac = request.headers.get("hmac") ?? request.headers.get("HMAC") ?? "";
  let payload: PaymobTransactionPayload;

  try {
    payload = (await request.json()) as PaymobTransactionPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const obj = payload.obj as Record<string, unknown> | undefined;
  if (!obj) {
    return NextResponse.json({ ok: true });
  }

  const hmacSecret = process.env.PAYMOB_HMAC_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && !hmacSecret) {
    console.error("[paymob] PAYMOB_HMAC_SECRET is required in production");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }

  if (!hmac || !verifyPaymobHmac(obj, hmac)) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
  }

  const orderId = extractOrderId(payload);
  if (!orderId) {
    return NextResponse.json({ ok: true });
  }

  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { data: order } = await supabase
    .from("spare_part_orders")
    .select("id, total_amount, payment_status, payment_method")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.payment_method !== "online") {
    return NextResponse.json({ ok: true });
  }

  const expectedAmount = amountToHalalas(Number(order.total_amount) || 0);
  const paidAmount = Number(payload.obj?.amount_cents ?? 0);
  const transactionId = String(payload.obj?.id ?? "");
  const success = Boolean(payload.obj?.success);
  const currency = payload.obj?.currency ?? "SAR";

  if (success && currency === "SAR" && paidAmount === expectedAmount) {
    if (order.payment_status !== "paid") {
      await supabase
        .from("spare_part_orders")
        .update({
          payment_status: "paid",
          payment_reference: transactionId || null,
        })
        .eq("id", orderId);
    }
  } else if (!success && order.payment_status === "pending") {
    await supabase
      .from("spare_part_orders")
      .update({ payment_status: "failed" })
      .eq("id", orderId);
  }

  return NextResponse.json({ ok: true });
}
