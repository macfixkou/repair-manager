"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useSupabase } from "@/components/supabase-provider";

export default function LoginPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      toast.error("メールまたはパスワードが違います。");
      return;
    }
    toast.success("ログインしました");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur rounded-xl shadow-2xl p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">修理管理アプリ</h1>
          <p className="text-sm text-gray-200 mt-2">ログインして案件を管理しましょう</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-200 block mb-1">メールアドレス</label>
            <input
              type="email"
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-200 block mb-1">パスワード</label>
            <input
              type="password"
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 rounded transition"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
        <p className="text-sm text-gray-200">
          はじめての方は{" "}
          <Link href="/signup" className="text-emerald-300 underline">
            サインアップ
          </Link>
        </p>
      </div>
    </div>
  );
}