// Source adapted from Supabase auth helpers docs
"use client";

import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { createContext, useContext, useState, useEffect } from "react";
import { Session, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabaseTypes";

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
  session: Session | null;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}) {
  const [supabase] = useState(() =>
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    )
  );
  const [session, setSession] = useState<Session | null>(initialSession);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return <Context.Provider value={{ supabase, session }}>{children}</Context.Provider>;
}

export const useSupabase = () => {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Supabase context not found");
  return ctx;
};
