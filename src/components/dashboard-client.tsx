"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CASE_STATUSES } from "@/lib/constants";
import toast from "react-hot-toast";

type CaseListItem = {
  id: string;
  status: string;
  customerName?: string | null;
  customerContact?: string | null;
  manufacturer?: string | null;
  modelNumber?: string | null;
  symptom: string;
  receivedAt: string;
  ageDays: number;
  stalled: boolean;
  stallThreshold: number;
  stalledByDays: number;
  assigneeUserId?: number | null;
  outcome?: string | null;
  finalDecision?: string | null;
  shareAnonymously: boolean;
  attachmentsCount?: number;
};

type CasesResponse = {
  cases: CaseListItem[];
};

export default function DashboardClient() {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(false);
  const [stalledOnly, setStalledOnly] = useState(false);

  const stalledCount = useMemo(() => cases.filter((c) => c.stalled).length, [cases]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, sort, stalledOnly]);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (sort) params.set("sort", sort);
    if (stalledOnly) params.set("stalled", "1");
    const res = await fetch(`/api/cases?${params.toString()}`, { cache: "no-store" });
    const data: CasesResponse & { error?: string } = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error || "案件の取得に失敗しました");
      return;
    }
    setCases(data.cases);
  };

  const downloadCsv = () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    window.location.href = `/api/export/cases.csv?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">案件一覧</h1>
          <p className="text-sm text-gray-600">滞留件数: {stalledCount}件</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/cases/new" className="bg-emerald-600 text-white px-4 py-2 rounded">
            新規案件
          </Link>
          <button
            onClick={downloadCsv}
            className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700"
          >
            CSV出力
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded shadow">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700 mb-1">検索（顧客/型番/症状/ID）</label>
          <div className="flex space-x-2">
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例: 山田 / ABC-123 / 起動しない"
            />
            <button
              onClick={load}
              className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700"
            >
              検索
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">ステータス</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">すべて</option>
            {CASE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">受付日 並び順</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "asc" | "desc")}
            className="w-full border rounded px-3 py-2"
          >
            <option value="desc">新しい順</option>
            <option value="asc">古い順</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">受付日 From</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">受付日 To</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            id="stalledOnly"
            type="checkbox"
            className="h-4 w-4"
            checked={stalledOnly}
            onChange={(e) => setStalledOnly(e.target.checked)}
          />
          <label htmlFor="stalledOnly" className="text-sm text-gray-700">
            滞留のみ表示
          </label>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
          <div className="col-span-3">顧客 / 症状</div>
          <div className="col-span-2">機器情報</div>
          <div className="col-span-2">ステータス</div>
          <div className="col-span-2">受付日</div>
          <div className="col-span-2">経過</div>
          <div className="col-span-1 text-right">添付</div>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-600">読み込み中...</div>
        ) : cases.length === 0 ? (
          <div className="p-6 text-center text-gray-600">案件がありません。</div>
        ) : (
          cases.map((item) => (
            <Link
              href={`/cases/${item.id}`}
              key={item.id}
              className="grid grid-cols-12 px-4 py-3 border-t hover:bg-gray-50 text-sm"
            >
              <div className="col-span-3">
                <div className="font-semibold text-gray-900">
                  {item.customerName || "顧客名未設定"}
                </div>
                <div className="text-gray-600">{item.symptom}</div>
              </div>
              <div className="col-span-2 text-gray-700">
                <div>{item.manufacturer}</div>
                <div className="text-xs text-gray-500">{item.modelNumber}</div>
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <StatusBadge status={item.status} />
                {item.stalled && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                    滞留 +{item.stalledByDays}日
                  </span>
                )}
              </div>
              <div className="col-span-2 text-gray-700">
                <div>{new Date(item.receivedAt).toLocaleDateString("ja-JP")}</div>
              </div>
              <div className="col-span-2 text-gray-800">
                <div className="font-semibold">経過 {item.ageDays}日</div>
                <div className="text-xs text-gray-500">期限 {item.stallThreshold}日</div>
              </div>
              <div className="col-span-1 text-right text-gray-700">{item.attachmentsCount ?? 0}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; color: string }> = {
    INTAKE: { label: "受付", color: "bg-gray-200 text-gray-800" },
    DIAGNOSING: { label: "診断中", color: "bg-amber-100 text-amber-800" },
    REPAIRING: { label: "修理中", color: "bg-blue-100 text-blue-800" },
    COMPLETED: { label: "完了", color: "bg-emerald-100 text-emerald-800" },
    RETURNED: { label: "返却", color: "bg-slate-200 text-slate-800" },
    DECLINED: { label: "再修理", color: "bg-gray-100 text-gray-700" },
    CANCELLED: { label: "キャンセル", color: "bg-zinc-200 text-zinc-800" },
    BUYBACK: { label: "買取", color: "bg-indigo-100 text-indigo-800" },
    DISPOSED: { label: "廃棄", color: "bg-rose-100 text-rose-800" },
  };
  const item = statusMap[status] ?? statusMap.INTAKE;
  return <span className={`text-xs px-2 py-1 rounded ${item.color}`}>{item.label}</span>;
}