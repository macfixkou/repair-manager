"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ALLOWED_MIME_TYPES, CASE_STATUSES, MAX_UPLOAD_SIZE } from "@/lib/constants";

export default function NewCaseForm() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    customerName: "",
    customerContact: "",
    manufacturer: "",
    modelName: "",
    modelNumber: "",
    boardNumber: "",
    symptom: "",
    receivedAt: today,
    status: CASE_STATUSES[0].value,
    shareAnonymously: false,
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentLimit, setAttachmentLimit] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const res = await fetch("/api/org/settings");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "設定の取得に失敗しました");
        return;
      }
      if (typeof data.attachmentLimitPaid === "number") {
        setAttachmentLimit(data.attachmentLimitPaid);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addAttachments = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    setAttachments((prev) => {
      const merged = [...prev, ...incoming];
      if (merged.length > attachmentLimit) {
        toast.error(`画像は最大${attachmentLimit}枚まで追加できます`);
      }
      return merged.slice(0, attachmentLimit);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAttachment = async (caseId: string, file: File) => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error("JPEG/PNG/WebPのみアップロードできます");
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      throw new Error("ファイルサイズは10MB以下にしてください");
    }
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/cases/${caseId}/attachments`, { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "アップロードに失敗しました");
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      toast.error(data.error || "保存に失敗しました");
      return;
    }
    let failedUploads = 0;
    if (attachments.length > 0) {
      const results = await Promise.allSettled(
        attachments.map((file) => uploadAttachment(data.case.id, file))
      );
      failedUploads = results.filter((result) => result.status === "rejected").length;
      if (failedUploads > 0) {
        toast.error(`画像のアップロードに失敗しました (${failedUploads}件)`);
      }
    }
    setLoading(false);
    toast.success("案件を作成しました");
    router.push(`/cases/${data.case.id}`);
  };

  return (
    <form onSubmit={submit} className="bg-white rounded shadow p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            顧客名 <span className="text-gray-500">(任意)</span>
          </label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={form.customerName}
            onChange={(e) => handleChange("customerName", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            連絡先（電話/メール） <span className="text-gray-500">(任意)</span>
          </label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={form.customerContact}
            onChange={(e) => handleChange("customerContact", e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">症状（必須）</label>
        <textarea
          className="w-full border rounded px-3 py-2"
          value={form.symptom}
          onChange={(e) => handleChange("symptom", e.target.value)}
          required
          rows={3}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">メーカー</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={form.manufacturer}
            onChange={(e) => handleChange("manufacturer", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">モデル名</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={form.modelName}
            onChange={(e) => handleChange("modelName", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">型番</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={form.modelNumber}
            onChange={(e) => handleChange("modelNumber", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">基板番号</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={form.boardNumber}
            onChange={(e) => handleChange("boardNumber", e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">受付日（必須）</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={form.receivedAt}
            onChange={(e) => handleChange("receivedAt", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">ステータス</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            {CASE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2 mt-6">
          <input
            type="checkbox"
            id="share"
            checked={form.shareAnonymously}
            onChange={(e) => handleChange("shareAnonymously", e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="share" className="text-sm text-gray-700">
            匿名共有可
          </label>
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-gray-700 mb-1">画像添付</label>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center justify-center border-2 border-dashed rounded px-4 py-3 cursor-pointer hover:bg-gray-50">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addAttachments(e.target.files);
                e.currentTarget.value = "";
              }}
            />
            <span className="text-sm text-gray-700">画像を選択</span>
          </label>
          <label className="flex items-center justify-center border-2 border-dashed rounded px-4 py-3 cursor-pointer hover:bg-gray-50">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                addAttachments(e.target.files);
                e.currentTarget.value = "";
              }}
            />
            <span className="text-sm text-gray-700">撮影</span>
          </label>
          <span className="ml-auto text-xs text-gray-500 self-center">{attachments.length}/{attachmentLimit}枚</span>
        </div>
        <p className="text-xs text-gray-500">JPEG/PNG/WebP・10MBまで</p>
        {attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between border rounded px-3 py-2">
                <div>
                  <p className="text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-sm text-red-600 hover:underline"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded"
        >
          {loading ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}
