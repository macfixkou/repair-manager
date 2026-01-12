import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabaseServer";

export default async function Home() {
  const supabase = serverClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }
  redirect("/dashboard");
}
