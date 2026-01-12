import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "./supabaseTypes";

function createClient() {
  const cookieStore = cookies();
  const canSet = typeof (cookieStore as any).set === "function";
  const canDelete = typeof (cookieStore as any).delete === "function";
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          if (canSet) {
            (cookieStore as any).set({ name, value, ...options });
          }
        },
        remove(name: string, options: any) {
          if (canDelete) {
            (cookieStore as any).delete({ name, ...options });
          }
        },
      },
    }
  );
}

export function serverClient() {
  return createClient();
}

export function routeClient() {
  return createClient();
}
