import { z } from "zod";
import { CaseStatus, FinalDecision, Outcome } from "@prisma/client";

export const signupSchema = z.object({
  orgName: z.string().min(1, "会社名を入力してください。"),
  name: z.string().min(1, "氏名を入力してください。"),
  email: z.string().email("メールアドレスの形式が正しくありません。"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください。"),
});

export const loginSchema = z.object({
  email: z.string().email("メールアドレスの形式が正しくありません。"),
  password: z.string().min(1, "パスワードを入力してください。"),
});

const baseCaseSchema = z.object({
  receivedAt: z.string().min(1, "受付日を入力してください。"),
  assigneeUserId: z.number().int().optional().nullable(),
  status: z.nativeEnum(CaseStatus).optional(),
  customerName: z.string().optional().nullable(),
  customerContact: z.string().optional().nullable(),
  customerNote: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  modelName: z.string().optional().nullable(),
  modelNumber: z.string().optional().nullable(),
  boardNumber: z.string().optional().nullable(),
  symptom: z.string().min(1, "症状を入力してください。"),
  initialHypothesis: z.string().optional().nullable(),
  actionsTaken: z.string().optional().nullable(),
  measurements: z.string().optional().nullable(),
  notDone: z.string().optional().nullable(),
  notDoneReason: z.string().optional().nullable(),
  outcome: z.nativeEnum(Outcome).optional().nullable(),
  finalDecision: z.nativeEnum(FinalDecision).optional().nullable(),
  shareAnonymously: z.boolean().optional(),
  shareNote: z.string().optional().nullable(),
});

export const createCaseSchema = baseCaseSchema
  .extend({
    status: z.nativeEnum(CaseStatus).default(CaseStatus.INTAKE),
  })
  .refine(
    (data) => Boolean(data.customerName) || Boolean(data.customerContact),
    "顧客名または連絡先のどちらかは必須です。"
  );

export const updateCaseSchema = baseCaseSchema
  .partial()
  .refine(
    (data) =>
      data.customerName !== undefined ||
      data.customerContact !== undefined ||
      data.symptom !== undefined ||
      data.receivedAt !== undefined ||
      data.status !== undefined ||
      data.assigneeUserId !== undefined ||
      data.initialHypothesis !== undefined ||
      data.actionsTaken !== undefined ||
      data.measurements !== undefined ||
      data.notDone !== undefined ||
      data.notDoneReason !== undefined ||
      data.outcome !== undefined ||
      data.finalDecision !== undefined ||
      data.shareAnonymously !== undefined ||
      data.shareNote !== undefined ||
      data.manufacturer !== undefined ||
      data.modelName !== undefined ||
      data.modelNumber !== undefined ||
      data.boardNumber !== undefined ||
      data.customerNote !== undefined,
    { message: "更新項目がありません。" }
  );

export const stallThresholdSchema = z.object({
  INTAKE: z.number().min(0, "0以上で入力してください。").max(30, "30以下で入力してください。").optional(),
  DIAGNOSING: z.number().min(0).max(30).optional(),
  REPAIRING: z.number().min(0).max(30).optional(),
  COMPLETED: z.number().min(0).max(30).optional(),
  RETURNED: z.number().min(0).max(30).optional(),
  DECLINED: z.number().min(0).max(30).optional(),
  CANCELLED: z.number().min(0).max(30).optional(),
  BUYBACK: z.number().min(0).max(30).optional(),
  DISPOSED: z.number().min(0).max(30).optional(),
});

export const attachmentLimitSchema = z.object({
  attachmentLimitFree: z.number().int().min(1).max(50).optional(),
  attachmentLimitPaid: z.number().int().min(1).max(50).optional(),
});

export const orgSettingsSchema = stallThresholdSchema.partial().merge(attachmentLimitSchema);
