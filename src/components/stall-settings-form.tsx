"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CASE_STATUSES } from "@/lib/constants";

type Thresholds = Record<string, number>;

export default function StallSettingsForm() {
  const [thresholds, setThresholds] = useState<Thresholds>({});
  const [attachmentLimits, setAttachmentLimits] = useState({ free: 5, paid: 10 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/org/settings");
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error || "設定の取得に失敗しました");
      return;
    }
    setThresholds(data.stallThresholds || {});
    setAttachmentLimits({
      free: data.attachmentLimitFree ?? 5,
      paid: data.attachmentLimitPaid ?? 10,
    });
  };

  const save = async () => {
    const res = await fetch("/api/org/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...thresholds,
        attachmentLimitFree: attachmentLimits.free,
        attachmentLimitPaid: attachmentLimits.paid,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "保存に失敗しました");
      return;
    }
    setThresholds(data.stallThresholds);
    setAttachmentLimits({
      free: data.attachmentLimitFree ?? attachmentLimits.free,
      paid: data.attachmentLimitPaid ?? attachmentLimits.paid,
    });
    toast.success("保存しました");
  };

  const updateValue = (status: string, value: number) => {
    setThresholds((prev) => ({ ...prev, [status]: value }));
  };

  const updateAttachmentLimit = (key: "free" | "paid", value: number) => {
    setAttachmentLimits((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <p>読み込み中...</p>;
  }

  return (
    <div className="bg-white rounded shadow p-6 space-y-4">
      <p className="text-sm text-gray-600">
        ステータスごとの期限（日数）を設定します。期限を超えると「滞留」として表示されます。
      </p>
      <div className="border rounded p-4 bg-gray-50 space-y-3">
        <p className="text-sm text-gray-700 font-semibold">画像添付の上限</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">無料プラン</label>
            <input
              type="number"
              min={1}
              max={50}
              className="w-full border rounded px-3 py-2"
              value={attachmentLimits.free}
              onChange={(e) => updateAttachmentLimit("free", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">有料プラン</label>
            <input
              type="number"
              min={1}
              max={50}
              className="w-full border rounded px-3 py-2"
              value={attachmentLimits.paid}
              onChange={(e) => updateAttachmentLimit("paid", Number(e.target.value))}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">案件作成・添付で使用する上限枚数です。</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CASE_STATUSES.map((s) => (
          <div key={s.value}>
            <label className="block text-sm text-gray-700 mb-1">{s.label}</label>
            <input
              type="number"
              min={0}
              max={30}
              className="w-full border rounded px-3 py-2"
              value={thresholds[s.value] ?? 0}
              onChange={(e) => updateValue(s.value, Number(e.target.value))}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <button onClick={save} className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700">
          保存
        </button>
      </div>
    </div>
  );
}


