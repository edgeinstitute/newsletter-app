"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseContextValue = {
  supabase: SupabaseClient<Database>;
};

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

type Props = {
  url: string;
  anonKey: string;
  children: React.ReactNode;
};

export function SupabaseProvider({ url, anonKey, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const supabase = useMemo(() => createBrowserClient<Database>(url, anonKey), [url, anonKey]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_OUT") return;
      const path = pathname ?? "";
      const isProtected = ["/dashboard", "/users", "/settings", "/profile"].some(
        (p) => path === p || path.startsWith(`${p}/`),
      );
      if (isProtected) router.replace("/login");
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase, router, pathname]);

  const value = useMemo(() => ({ supabase }), [supabase]);

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabase(): SupabaseClient<Database> {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error("useSupabase must be used within SupabaseProvider");
  return ctx.supabase;
}
