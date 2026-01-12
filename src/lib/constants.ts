export type CaseStatusValue =
  | "INTAKE"
  | "DIAGNOSING"
  | "REPAIRING"
  | "COMPLETED"
  | "RETURNED"
  | "DECLINED"
  | "CANCELLED"
  | "BUYBACK"
  | "DISPOSED";

export const CASE_STATUSES: { value: CaseStatusValue; label: string }[] = [
  { value: "INTAKE", label: "受付" },
  { value: "DIAGNOSING", label: "診断中" },
  { value: "REPAIRING", label: "修理中" },
  { value: "COMPLETED", label: "完了" },
  { value: "RETURNED", label: "返却" },
  { value: "DECLINED", label: "再修理" },
  { value: "CANCELLED", label: "キャンセル" },
  { value: "BUYBACK", label: "買取" },
  { value: "DISPOSED", label: "廃棄" },
];

export const CASE_OUTCOMES = [
  { value: "SUCCESS", label: "成功" },
  { value: "FAILURE", label: "失敗" },
  { value: "UNRESOLVED", label: "未解決" },
];

export const FINAL_DECISIONS = [
  { value: "REPAIR", label: "修理して返却" },
  { value: "RETURN", label: "そのまま返却" },
  { value: "BUYBACK", label: "買取" },
  { value: "DISPOSE", label: "廃棄" },
];

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
