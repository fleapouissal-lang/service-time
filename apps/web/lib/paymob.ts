const PAYMOB_BASE_URL =
  process.env.PAYMOB_BASE_URL?.trim() || "https://ksa.paymob.com";

const PLACEHOLDER_PATTERNS = [
  /^\.\.\.$/,
  /\.{3}$/,
  /^your_/i,
  /^xxx+$/i,
  /^123456$/,
];

export type PaymobIntentionResult = {
  clientSecret: string;
  intentionId: string;
};

export type PaymobBillingData = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
};

function isPlaceholderValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function getPaymobSecretKey(): string {
  return process.env.PAYMOB_SECRET_KEY?.trim() ?? "";
}

function getPaymobIntegrationIds(): number[] {
  const raw =
    process.env.PAYMOB_INTEGRATION_IDS ??
    process.env.PAYMOB_INTEGRATION_ID ??
    "";
  return raw
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);
}

export function getPaymobPublicKey(): string {
  return (
    process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY?.trim() ??
    process.env.PAYMOB_PUBLIC_KEY?.trim() ??
    ""
  );
}

export function getPaymobConfigurationError(): string | null {
  const secretKey = getPaymobSecretKey();
  const publicKey = getPaymobPublicKey();
  const integrationIds = getPaymobIntegrationIds();

  if (!secretKey || isPlaceholderValue(secretKey)) {
    return "مفتاح PAYMOB_SECRET_KEY غير مضبوط. أضف المفتاح السري الحقيقي من لوحة Accept (Paymob) في ملف .env ثم أعد تشغيل الخادم.";
  }

  if (!publicKey || isPlaceholderValue(publicKey)) {
    return "مفتاح NEXT_PUBLIC_PAYMOB_PUBLIC_KEY غير مضبوط. أضف المفتاح العام من لوحة Accept (Paymob).";
  }

  if (integrationIds.length === 0) {
    return "PAYMOB_INTEGRATION_IDS غير مضبوط. أضف Integration ID من لوحة Paymob (مثال: 123456).";
  }

  if (!secretKey.startsWith("sk_")) {
    return "PAYMOB_SECRET_KEY غير صالح. يجب أن يبدأ بـ sk_test_ أو sk_live_.";
  }

  if (!publicKey.startsWith("pk_")) {
    return "NEXT_PUBLIC_PAYMOB_PUBLIC_KEY غير صالح. يجب أن يبدأ بـ pk_test_ أو pk_live_.";
  }

  return null;
}

export function isPaymobConfigured(): boolean {
  return getPaymobConfigurationError() === null;
}

export function amountToHalalas(amountSar: number): number {
  return Math.round(amountSar * 100);
}

export function splitFullName(fullName: string): {
  first_name: string;
  last_name: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { first_name: "Client", last_name: "ServiceTime" };
  }
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: "ServiceTime" };
  }
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
}

export function normalizePaymobPhone(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("966")) return `+${digits}`;
  if (digits.startsWith("05")) return `+966${digits.slice(1)}`;
  if (digits.length >= 9) return `+966${digits.slice(-9)}`;
  return "+966583814214";
}

function mapPaymobApiError(status: number, body: string): string {
  if (body.includes("Authentication credentials were not provided")) {
    return "فشل المصادقة مع Paymob. تحقق من PAYMOB_SECRET_KEY في .env (المفتاح السري الكامل من لوحة Accept) ثم أعد تشغيل npm run dev.";
  }
  if (status === 401 || status === 403) {
    return "مفاتيح Paymob غير صحيحة أو حساب غير مفعّل. تحقق من Secret Key و Integration ID.";
  }
  return `تعذر بدء الدفع (${status}). تحقق من إعدادات Paymob.`;
}

export async function createPaymobIntention(input: {
  amountSar: number;
  orderId: string;
  orderToken: string;
  billing: PaymobBillingData;
  redirectionUrl: string;
  notificationUrl: string;
  itemName?: string;
  specialReference?: string;
}): Promise<PaymobIntentionResult> {
  const configError = getPaymobConfigurationError();
  if (configError) {
    throw new Error(configError);
  }

  const secretKey = getPaymobSecretKey();
  const integrationIds = getPaymobIntegrationIds();
  const amount = amountToHalalas(input.amountSar);

  if (amount <= 0) {
    throw new Error("مبلغ الطلب غير صالح للدفع.");
  }

  const itemName = input.itemName ?? `طلب قطع غيار ${input.orderToken}`;
  const specialReference = input.specialReference ?? input.orderId;

  const response = await fetch(`${PAYMOB_BASE_URL}/v1/intention/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${secretKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: "SAR",
      payment_methods: integrationIds,
      items: [
        {
          name: itemName,
          amount,
          description: input.orderToken,
          quantity: 1,
        },
      ],
      billing_data: {
        apartment: "NA",
        first_name: input.billing.first_name,
        last_name: input.billing.last_name,
        street: "NA",
        building: "NA",
        phone_number: input.billing.phone_number,
        city: "Riyadh",
        country: "SA",
        email: input.billing.email,
        floor: "NA",
        state: "NA",
        postal_code: "NA",
        shipping_method: "NA",
      },
      special_reference: specialReference,
      expiration: 3600,
      notification_url: input.notificationUrl,
      redirection_url: input.redirectionUrl,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(mapPaymobApiError(response.status, body));
  }

  const data = (await response.json()) as {
    client_secret?: string;
    id?: string;
  };

  if (!data.client_secret) {
    throw new Error("Paymob intention missing client_secret");
  }

  return {
    clientSecret: data.client_secret,
    intentionId: String(data.id ?? ""),
  };
}

export function buildPaymobCheckoutUrl(clientSecret: string): string {
  const publicKey = getPaymobPublicKey();
  const params = new URLSearchParams({
    publicKey,
    clientSecret,
  });
  return `${PAYMOB_BASE_URL}/unifiedcheckout/?${params.toString()}`;
}

export function getPaymobBaseUrl(): string {
  return PAYMOB_BASE_URL;
}
