import { ReactNode } from "react";
import { redirect } from "next/navigation";
import TopNav from "@/components/top-nav";
import { serverClient } from "@/lib/supabaseServer";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const supabase = serverClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }
  return (
    <div className="min-h-screen bg-gray-100">
      <TopNav />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
