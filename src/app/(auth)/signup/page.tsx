"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useSupabase } from "@/components/supabase-provider";

export default function SignupPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgName, name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      toast.error(data.error ?? "登録に失敗しました");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      toast.error("ログインに失敗しました");
      return;
    }
    toast.success("登録しました");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur rounded-xl shadow-2xl p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">アカウント作成</h1>
          <p className="text-sm text-gray-200 mt-2">組織を作成し、最初のユーザーを登録します。</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-200 block mb-1">組織名</label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-200 block mb-1">氏名</label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 rounded transition"
          >
            {loading ? "登録中..." : "サインアップ"}
          </button>
        </form>
        <p className="text-sm text-gray-200">
          既にアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-emerald-300 underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}