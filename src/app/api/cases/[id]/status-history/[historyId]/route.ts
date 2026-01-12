import { NextResponse } from "next/server";
import { CaseStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/apiError";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string; historyId: string } };

export async function PUT(req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const historyId = Number(params.historyId);
    if (!Number.isFinite(historyId)) {
      throw new ApiError(400, "履歴IDが不正です。");
    }
    const body = await req.json();
    const status = body?.status as CaseStatus | undefined;
    if (!status || !Object.values(CaseStatus).includes(status)) {
      throw new ApiError(400, "ステータスが不正です。");
    }
    const existing = await prisma.caseStatusHistory.findFirst({
      where: { id: historyId, caseId: params.id, orgId: user.orgId },
    });
    if (!existing) {
      throw new ApiError(404, "履歴が見つかりません。");
    }
    const updated = await prisma.caseStatusHistory.update({
      where: { id: historyId },
      data: { status },
    });
    return NextResponse.json({ history: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const historyId = Number(params.historyId);
    if (!Number.isFinite(historyId)) {
      throw new ApiError(400, "履歴IDが不正です。");
    }
    const existing = await prisma.caseStatusHistory.findFirst({
      where: { id: historyId, caseId: params.id, orgId: user.orgId },
    });
    if (!existing) {
      throw new ApiError(404, "履歴が見つかりません。");
    }
    await prisma.caseStatusHistory.delete({ where: { id: historyId } });
    return NextResponse.json({ message: "deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}