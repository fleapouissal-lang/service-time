function supabaseOrigins(): { https: string; wss: string } | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    return {
      https: url.origin,
      wss: url.origin.replace(/^https:/, "wss:"),
    };
  } catch {
    return null;
  }
}

/** Build Content-Security-Policy for Next.js (report-only in dev if needed). */
export function buildContentSecurityPolicy(isDev: boolean): string {
  const supabase = supabaseOrigins();
  const scriptSrc = ["'self'", "'unsafe-inline'"];
  if (isDev) {
    scriptSrc.push("'unsafe-eval'");
  }

  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "https://images.unsplash.com",
  ];
  if (supabase) {
    imgSrc.push(supabase.https);
  }

  const connectSrc = ["'self'", "https://ksa.paymob.com"];
  if (supabase) {
    connectSrc.push(supabase.https, supabase.wss);
  }

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": imgSrc,
    "font-src": ["'self'"],
    "connect-src": connectSrc,
    "frame-src": [
      "'self'",
      "https://maps.google.com",
      "https://www.google.com",
      "https://ksa.paymob.com",
    ],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "worker-src": ["'self'", "blob:"],
  };

  if (!isDev) {
    directives["upgrade-insecure-requests"] = [];
  }

  return Object.entries(directives)
    .map(([name, values]) =>
      values.length === 0 ? name : `${name} ${values.join(" ")}`,
    )
    .join("; ");
}
