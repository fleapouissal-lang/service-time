"use client";

import { useEffect, useState } from "react";
import type { ProfileRole } from "@service-time/types";
import { createAuthBrowserClient } from "@/lib/supabase-browser";

export function useIsClientForCart() {
  const [isClient, setIsClient] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const supabase = createAuthBrowserClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsClient(false);
        setChecked(true);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .maybeSingle();

      setIsClient(
        Boolean(data?.is_active && (data.role as ProfileRole) === "client"),
      );
      setChecked(true);
    }

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isClient, checked };
}
