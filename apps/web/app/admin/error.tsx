"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOptionalLocale } from "@/lib/i18n/locale-context";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useOptionalLocale()?.locale ?? "ar";
  const isAr = locale === "ar";

  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <Card>
      <CardContent className="space-y-4 p-6 text-center">
        <p className="font-semibold">
          {isAr ? "تعذّر تحميل هذه الصفحة." : "This page could not be loaded."}
        </p>
        <p className="text-sm text-muted">
          {isAr
            ? "حدث خطأ أثناء جلب البيانات. حاول مجدداً."
            : "Something went wrong while loading data. Please try again."}
        </p>
        <Button type="button" onClick={reset}>
          {isAr ? "إعادة المحاولة" : "Try again"}
        </Button>
      </CardContent>
    </Card>
  );
}
