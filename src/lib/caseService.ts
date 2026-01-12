import { prisma } from "./prisma";
import { ApiError } from "./apiError";
import { calcStallInfo, parseStallThresholds } from "./stall";
import { CaseStatus } from "@prisma/client";

export type CaseFilters = {
  query?: string;
  status?: string;
  from?: string;
  to?: string;
  sort?: "asc" | "desc";
  stalledOnly?: boolean;
};

export async function listCases(orgId: number, filters: CaseFilters) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    throw new ApiError(404, "組織が見つかりません。");
  }
  const thresholds = parseStallThresholds(org.stallThresholdsJson);
  const where: any = { orgId, deletedAt: null };
  if (filters.status) {
    const statusValue = filters.status as CaseStatus;
    if (!Object.values(CaseStatus).includes(statusValue)) {
      throw new ApiError(400, "不正なステータスです。");
    }
    where.status = statusValue;
  }
  if (filters.query) {
    const q = filters.query;
    where.OR = [
      { customerName: { contains: q, mode: "insensitive" } },
      { customerContact: { contains: q, mode: "insensitive" } },
      { modelNumber: { contains: q, mode: "insensitive" } },
      { symptom: { contains: q, mode: "insensitive" } },
      { id: { equals: q } },
    ];
  }
  if (filters.from) {
    const d = new Date(filters.from);
    if (Number.isNaN(d.getTime())) throw new ApiError(400, "fromの日付が不正です。");
    where.receivedAt = { ...(where.receivedAt || {}), gte: d };
  }
  if (filters.to) {
    const d = new Date(filters.to);
    if (Number.isNaN(d.getTime())) throw new ApiError(400, "toの日付が不正です。");
    where.receivedAt = { ...(where.receivedAt || {}), lte: d };
  }
  const items = await prisma.case.findMany({
    where,
    orderBy: { receivedAt: filters.sort === "asc" ? "asc" : "desc" },
    include: { _count: { select: { attachments: true } } },
  });
  const now = new Date();
  const computed = items.map(({ _count, ...c }) => {
    const stall = calcStallInfo(c.status, c.receivedAt, thresholds, now);
    return {
      ...c,
      ...stall,
      attachmentsCount: _count.attachments,
    };
  });
  const filtered = filters.stalledOnly ? computed.filter((c) => c.stalled) : computed;
  return { cases: filtered, thresholds };
}

export async function getCaseById(orgId: number, id: string) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    throw new ApiError(404, "組織が見つかりません。");
  }
  const thresholds = parseStallThresholds(org.stallThresholdsJson);
  const item = await prisma.case.findFirst({
    where: { id, orgId, deletedAt: null },
    include: {
      attachments: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!item) {
    throw new ApiError(404, "案件が見つかりません。");
  }
  const stall = calcStallInfo(item.status, item.receivedAt, thresholds, new Date());
  return { case: { ...item, ...stall }, thresholds };
}