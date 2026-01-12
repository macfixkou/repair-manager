import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "./supabaseTypes";

function createClient({ allowSet }: { allowSet: boolean }) {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          if (!allowSet) return;
          try {
            (cookieStore as any).set({ name, value, ...options });
          } catch {
            // Ignore in Server Components where cookies are read-only.
          }
        },
        remove(name: string, options: any) {
          if (!allowSet) return;
          try {
            (cookieStore as any).delete({ name, ...options });
          } catch {
            // Ignore in Server Components where cookies are read-only.
          }
        },
      },
    }
  );
}

export function serverClient() {
  return createClient({ allowSet: false });
}

export function routeClient() {
  return createClient({ allowSet: true });
}
