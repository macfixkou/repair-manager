"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabase } from "./supabase-provider";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/cases/new", label: "案件作成" },
  { href: "/settings", label: "設定" },
];

export default function TopNav() {
  const { session, supabase } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };
  return (
    <header className="bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="font-bold">Repair Manager</span>
          <nav className="flex items-center space-x-3 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2 py-1 rounded ${
                  pathname.startsWith(item.href) ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-3 text-sm">
          <span className="text-gray-200">{session?.user?.email}</span>
          <button
            onClick={handleLogout}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
