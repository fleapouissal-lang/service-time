"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n/locale-context";
import { Label } from "@/components/ui/label";

const TRACK_BASE = "/client/track";

export function TrackingSearch({ embedded = false }: { embedded?: boolean }) {
  const { messages: t } = useLocale();
  const router = useRouter();
  const [token, setToken] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = token.trim();
    if (trimmed) router.push(`${TRACK_BASE}/${trimmed}`);
  }

  return (
    <div className={embedded ? "space-y-4" : ""}>
      {!embedded ? (
        <div className="mb-6">
          <h2 className="text-xl font-bold">{t.tracking.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {t.tracking.description}
          </p>
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <Label htmlFor="token">{t.tracking.tokenLabel}</Label>
        <Input
          id="token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder={t.tracking.tokenPlaceholder}
          className="mt-2"
          dir="ltr"
        />
        <Button type="submit" variant="default" className="mt-4 w-full">
          {t.tracking.submit}
        </Button>
      </form>

      <p className="text-center text-xs text-muted">
        {t.tracking.ordersLink}{" "}
        <Link href="/client/orders" className="text-primary hover:underline">
          {t.tracking.ordersLinkText}
        </Link>
      </p>
    </div>
  );
}
