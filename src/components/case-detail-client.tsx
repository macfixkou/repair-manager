"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ALLOWED_MIME_TYPES,
  CASE_OUTCOMES,
  CASE_STATUSES,
  FINAL_DECISIONS,
  MAX_UPLOAD_SIZE,
} from "@/lib/constants";

type Attachment = {
  id: number;
  fileName: string;
  filePath: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

type CaseData = {
  id: string;
  status: string;
  customerName?: string | null;
  customerContact?: string | null;
  customerNote?: string | null;
  manufacturer?: string | null;
  modelName?: string | null;
  modelNumber?: string | null;
  boardNumber?: string | null;
  symptom: string;
  initialHypothesis?: string | null;
  actionsTaken?: string | null;
  measurements?: string | null;
  notDone?: string | null;
  notDoneReason?: string | null;
  outcome?: string | null;
  finalDecision?: string | null;
  shareAnonymously: boolean;
  shareNote?: string | null;
  receivedAt: string | Date;
  createdAt: string;
  updatedAt?: string;
  ageDays: number;
  stalled: boolean;
  stallThreshold: number;
  stalledByDays: number;
  attachments: Attachment[];
  statusHistory: { id: number; status: string; createdAt: string }[];
};

type Props = {
  initialCase: CaseData;
  stallThresholds: Record<string, number>;
};

type CalendarNote = {
  phone: string;
  email: string;
};

const EMPTY_NOTE: CalendarNote = {
  phone: "",
  email: "",
};

function toDateKey(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function monthLabel(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const firstDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  if (cells.length < 35) {
    while (cells.length < 35) cells.push(null);
  }
  return cells;
}

export default function CaseDetailClient({ initialCase, stallThresholds }: Props) {
  const [caseData, setCaseData] = useState<CaseData>({
    ...initialCase,
    statusHistory: initialCase.statusHistory || [],
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [attachmentsCollapsed, setAttachmentsCollapsed] = useState(false);
  const [editingHistoryId, setEditingHistoryId] = useState<number | null>(null);
  const [editingHistoryStatus, setEditingHistoryStatus] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [calendarNotes, setCalendarNotes] = useState<Record<string, CalendarNote>>({});

  const statusLabelMap: Record<string, string> = {
    INTAKE: "受付",
    DIAGNOSING: "診断中",
    REPAIRING: "修理中",
    COMPLETED: "完了",
    RETURNED: "返却",
    DECLINED: "再修理",
    CANCELLED: "キャンセル",
    BUYBACK: "買取",
    DISPOSED: "廃棄",
  };

  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const selectedNote = calendarNotes[selectedDateKey] ?? EMPTY_NOTE;

  const updateCalendarNote = (field: keyof CalendarNote, value: string) => {
    setCalendarNotes((prev) => ({
      ...prev,
      [selectedDateKey]: {
        ...prev[selectedDateKey],
        ...selectedNote,
        [field]: value,
      },
    }));
  };

  const handleChange = (field: keyof CaseData, value: any) => {
    setCaseData((prev) => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      ...caseData,
      receivedAt: new Date(caseData.receivedAt).toISOString().slice(0, 10),
    };
    const res = await fetch(`/api/cases/${caseData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error || "保存に失敗しました");
      return;
    }
    setCaseData((prev) => ({ ...prev, ...data.case }));
    toast.success("保存しました");
  };

  const updateStatus = async (status: string) => {
    const res = await fetch(`/api/cases/${caseData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "更新に失敗しました");
      return;
    }
    setCaseData((prev) => ({ ...prev, ...data.case }));
    toast.success("ステータスを変更しました");
  };

  const uploadAttachment = async (file?: File) => {
    if (!file) return;
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error("JPEG/PNG/WebPのみアップロードできます");
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      toast.error("ファイルサイズは10MB以下にしてください");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    setUploading(true);
    const res = await fetch(`/api/cases/${caseData.id}/attachments`, { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      toast.error(data.error || "アップロードに失敗しました");
      return;
    }
    setCaseData((prev) => ({ ...prev, attachments: [...prev.attachments, data.attachment] }));
    toast.success("アップロードしました");
  };

  const deleteAttachment = async (id: number) => {
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "削除に失敗しました");
      return;
    }
    setCaseData((prev) => ({ ...prev, attachments: prev.attachments.filter((a) => a.id !== id) }));
    toast.success("削除しました");
  };

  const copyShareJson = async () => {
    const res = await fetch(`/api/cases/${caseData.id}/share-export`);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "共有データを取得できませんでした");
      return;
    }
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success("共有データをコピーしました");
  };

  const startEditHistory = (id: number, status: string) => {
    setEditingHistoryId(id);
    setEditingHistoryStatus(status);
  };

  const cancelEditHistory = () => {
    setEditingHistoryId(null);
    setEditingHistoryStatus("");
  };

  const saveHistory = async (id: number) => {
    const res = await fetch(`/api/cases/${caseData.id}/status-history/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: editingHistoryStatus }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "履歴の更新に失敗しました");
      return;
    }
    setCaseData((prev) => ({
      ...prev,
      statusHistory: prev.statusHistory.map((item) =>
        item.id === id ? { ...item, status: data.history.status } : item
      ),
    }));
    cancelEditHistory();
    toast.success("履歴を更新しました");
  };

  const deleteHistory = async (id: number) => {
    const res = await fetch(`/api/cases/${caseData.id}/status-history/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "履歴の削除に失敗しました");
      return;
    }
    setCaseData((prev) => ({
      ...prev,
      statusHistory: prev.statusHistory.filter((item) => item.id !== id),
    }));
    toast.success("履歴を削除しました");
  };

  return (
    <div className="space-y-6">
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white text-2xl"
            onClick={() => setPreview(null)}
            aria-label="Close preview"
          >
            ×
          </button>
          <div className="flex flex-col items-center gap-3">
            <img
              src={preview.url}
              alt={preview.name}
              className="max-h-[85vh] max-w-[92vw] w-full md:w-[900px] rounded shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-xs text-gray-200">{preview.name}</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">案件詳細</h1>
          <p className="text-gray-600 text-sm" title={caseData.id}>
            ID: {caseData.id.split("-")[0]}
          </p>
          <p className="text-sm text-gray-700">
            経過 {caseData.ageDays}日 / 期限 {caseData.stallThreshold}日{" "}
            {caseData.stalled && (
              <span className="text-red-600 font-semibold">滞留 +{caseData.stalledByDays}日</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CASE_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => updateStatus(s.value)}
              className={`px-3 py-1 rounded text-sm border ${
                caseData.status === s.value ? "bg-slate-900 text-white" : "bg-white hover:bg-gray-100"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 bg-white rounded shadow p-5 space-y-4">
          <h2 className="font-semibold text-lg">顧客・機器情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="顧客名" value={caseData.customerName || ""} onChange={(v) => handleChange("customerName", v)} />
            <Field label="連絡先" value={caseData.customerContact || ""} onChange={(v) => handleChange("customerContact", v)} />
            <Field label="メーカー" value={caseData.manufacturer || ""} onChange={(v) => handleChange("manufacturer", v)} />
            <Field label="モデル名" value={caseData.modelName || ""} onChange={(v) => handleChange("modelName", v)} />
            <Field label="型番" value={caseData.modelNumber || ""} onChange={(v) => handleChange("modelNumber", v)} />
            <Field label="基板番号" value={caseData.boardNumber || ""} onChange={(v) => handleChange("boardNumber", v)} />
            <Field
              label="受付日"
              type="date"
              value={new Date(caseData.receivedAt).toISOString().slice(0, 10)}
              onChange={(v) => handleChange("receivedAt", v)}
            />
            <div className="flex items-center space-x-2">
              <input
                id="share"
                type="checkbox"
                checked={caseData.shareAnonymously}
                onChange={(e) => handleChange("shareAnonymously", e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="share" className="text-sm text-gray-700">
                匿名共有を許可
              </label>
            </div>
          </div>
          <TextArea label="顧客備考" value={caseData.customerNote || ""} onChange={(v) => handleChange("customerNote", v)} />
          <TextArea label="症状" required value={caseData.symptom} onChange={(v) => handleChange("symptom", v)} />
          <TextArea label="初期仮説" value={caseData.initialHypothesis || ""} onChange={(v) => handleChange("initialHypothesis", v)} />
          <TextArea label="実施したこと" value={caseData.actionsTaken || ""} onChange={(v) => handleChange("actionsTaken", v)} />
          <TextArea label="測定・確認内容" value={caseData.measurements || ""} onChange={(v) => handleChange("measurements", v)} />
          <TextArea label="やらなかったこと" value={caseData.notDone || ""} onChange={(v) => handleChange("notDone", v)} />
          <TextArea label="その理由" value={caseData.notDoneReason || ""} onChange={(v) => handleChange("notDoneReason", v)} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectField
              label="結果"
              value={caseData.outcome || ""}
              onChange={(v) => handleChange("outcome", v || null)}
              options={CASE_OUTCOMES}
              placeholder="未設定"
            />
            <SelectField
              label="最終判断"
              value={caseData.finalDecision || ""}
              onChange={(v) => handleChange("finalDecision", v || null)}
              options={FINAL_DECISIONS}
              placeholder="未設定"
            />
            <div>
              <label className="text-sm text-gray-700 mb-1 block">共有メモ</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={caseData.shareNote || ""}
                onChange={(e) => handleChange("shareNote", e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </section>

        <section className="bg-white rounded shadow p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">添付ファイル</h2>
            <button
              type="button"
              onClick={() => setAttachmentsCollapsed((prev) => !prev)}
              className="text-xl text-slate-700 hover:text-slate-900"
              aria-label={attachmentsCollapsed ? "開く" : "折り畳む"}
              title={attachmentsCollapsed ? "開く" : "折り畳む"}
            >
              {attachmentsCollapsed ? "＋" : "−"}
            </button>
          </div>
          {!attachmentsCollapsed && (
            <>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center justify-center border-2 border-dashed rounded px-4 py-3 cursor-pointer hover:bg-gray-50">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach((file) => {
                        void uploadAttachment(file);
                      });
                      e.currentTarget.value = "";
                    }}
                  />
                  <span className="text-sm text-gray-700">{uploading ? "アップロード中..." : "画像を選択"}</span>
                </label>
                <label className="flex items-center justify-center border-2 border-dashed rounded px-4 py-3 cursor-pointer hover:bg-gray-50">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach((file) => {
                        void uploadAttachment(file);
                      });
                      e.currentTarget.value = "";
                    }}
                  />
                  <span className="text-sm text-gray-700">撮影</span>
                </label>
              </div>
              <div className="space-y-2">
                {caseData.attachments.length === 0 && <p className="text-sm text-gray-600">添付はまだありません。</p>}
                {caseData.attachments.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {caseData.attachments.map((att) => {
                      const isImage = att.mimeType.startsWith("image/");
                      return (
                        <div key={att.id} className="border rounded p-2 bg-white">
                          {isImage ? (
                            <>
                              <button
                                type="button"
                                className="w-full"
                                onClick={() => setPreview({ url: att.filePath, name: att.fileName })}
                                aria-label="画像プレビュー"
                              >
                                <div className="w-full h-16 md:h-20 rounded overflow-hidden bg-gray-100">
                                  <img
                                    src={att.filePath}
                                    alt={att.fileName}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              </button>
                              <p className="text-xs text-gray-600 mt-1 truncate" title={att.fileName}>
                                {att.fileName}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm font-semibold break-all">{att.fileName}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {Math.round(att.size / 1024)} KB / {new Date(att.createdAt).toLocaleString("ja-JP")}
                          </p>
                          <div className="flex items-center justify-end space-x-2 mt-2">
                            <a
                              href={att.filePath}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-700 underline"
                            >
                              開く
                            </a>
                            <button
                              onClick={() => deleteAttachment(att.id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
          <div className="space-y-2">
            <p className="text-sm text-gray-700">共有用データ</p>
            <button
              onClick={copyShareJson}
              className="w-full bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800"
            >
              共有用データをコピー
            </button>
            <p className="text-xs text-gray-500">顧客情報は含まれません。匿名共有ONの案件のみ取得できます。</p>
          </div>
          <div className="border-t pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 font-semibold">予定カレンダー</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-sm text-slate-700"
                  onClick={() =>
                    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                  }
                >
                  ←
                </button>
                <span className="text-sm text-gray-700">{monthLabel(calendarMonth)}</span>
                <button
                  type="button"
                  className="text-sm text-slate-700"
                  onClick={() =>
                    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                  }
                >
                  →
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs text-center text-gray-500">
              {"日月火水木金土".split("").map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="h-8" />;
                }
                const key = toDateKey(day);
                const isSelected = key === selectedDateKey;
                const hasNote = calendarNotes[key] &&
                  (calendarNotes[key].phone || calendarNotes[key].email);
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setSelectedDateKey(key)}
                    className={`h-8 rounded border ${
                      isSelected ? "bg-emerald-600 text-white" : "bg-white text-gray-700"
                    } ${hasNote ? "border-emerald-400" : "border-gray-200"}`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">選択日: {selectedDateKey}</p>
              <div className="space-y-2">
                <TextArea
                  label="電話連絡"
                  value={selectedNote.phone}
                  onChange={(v) => updateCalendarNote("phone", v)}
                />
                <TextArea
                  label="メール連絡"
                  value={selectedNote.email}
                  onChange={(v) => updateCalendarNote("email", v)}
                />
              </div>
            </div>
            <div className="border-t pt-3 space-y-1">
              <p className="text-sm text-gray-700">進捗</p>
              <p className="text-xs text-gray-600">ステータス: {statusLabelMap[caseData.status] || caseData.status}</p>
              <p className="text-xs text-gray-600">経過: {caseData.ageDays}日</p>
              <p className="text-xs text-gray-600">期限: {caseData.stallThreshold}日</p>
              <p className="text-xs text-gray-600">
                ステータス変更: {new Date(caseData.updatedAt ?? caseData.createdAt).toLocaleString("ja-JP")}
              </p>
              {caseData.stalled && (
                <p className="text-xs text-red-600">滞留 +{caseData.stalledByDays}日</p>
              )}
            </div>
            {caseData.statusHistory.length > 0 && (
              <div className="border-t pt-3 space-y-1">
                <p className="text-sm text-gray-700">ステータス履歴</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {caseData.statusHistory.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2">
                      {editingHistoryId === item.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            className="border rounded px-2 py-1 text-xs"
                            value={editingHistoryStatus}
                            onChange={(e) => setEditingHistoryStatus(e.target.value)}
                          >
                            {CASE_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          <span className="text-gray-400">/</span>
                          <span>{new Date(item.createdAt).toLocaleString("ja-JP")}</span>
                        </div>
                      ) : (
                        <span>
                          {statusLabelMap[item.status] || item.status} /{" "}
                          {new Date(item.createdAt).toLocaleString("ja-JP")}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        {editingHistoryId === item.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveHistory(item.id)}
                              className="text-xs text-emerald-700 hover:underline"
                            >
                              保存
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditHistory}
                              className="text-xs text-gray-500 hover:underline"
                            >
                              取消
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditHistory(item.id, item.status)}
                              className="text-xs text-blue-700 hover:underline"
                            >
                              編集
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteHistory(item.id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              削除
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        className="w-full border rounded px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        className="w-full border rounded px-3 py-2"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-3 py-2"
      >
        <option value="">{placeholder || "選択してください"}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
