import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/apiError";
import { getCaseById } from "@/lib/caseService";
import { prisma } from "@/lib/prisma";
import { parseDate } from "@/lib/utils";
import { updateCaseSchema } from "@/lib/validation";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const result = await getCaseById(user.orgId, params.id);
    return NextResponse.json(result.case);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = updateCaseSchema.parse(body);
    const existing = await prisma.case.findFirst({
      where: { id: params.id, orgId: user.orgId, deletedAt: null },
    });
    if (!existing) {
      throw new ApiError(404, "案件が見つかりません。");
    }
    const data: Record<string, unknown> = {};
    if (parsed.receivedAt !== undefined) data.receivedAt = parseDate(parsed.receivedAt, "受付日");
    if (parsed.assigneeUserId !== undefined) data.assigneeUserId = parsed.assigneeUserId;
    if (parsed.status !== undefined) data.status = parsed.status;
    if (parsed.customerName !== undefined) data.customerName = parsed.customerName ?? null;
    if (parsed.customerContact !== undefined) data.customerContact = parsed.customerContact ?? null;
    if (parsed.customerNote !== undefined) data.customerNote = parsed.customerNote ?? null;
    if (parsed.manufacturer !== undefined) data.manufacturer = parsed.manufacturer ?? null;
    if (parsed.modelName !== undefined) data.modelName = parsed.modelName ?? null;
    if (parsed.modelNumber !== undefined) data.modelNumber = parsed.modelNumber ?? null;
    if (parsed.boardNumber !== undefined) data.boardNumber = parsed.boardNumber ?? null;
    if (parsed.symptom !== undefined) data.symptom = parsed.symptom;
    if (parsed.initialHypothesis !== undefined) data.initialHypothesis = parsed.initialHypothesis ?? null;
    if (parsed.actionsTaken !== undefined) data.actionsTaken = parsed.actionsTaken ?? null;
    if (parsed.measurements !== undefined) data.measurements = parsed.measurements ?? null;
    if (parsed.notDone !== undefined) data.notDone = parsed.notDone ?? null;
    if (parsed.notDoneReason !== undefined) data.notDoneReason = parsed.notDoneReason ?? null;
    if (parsed.outcome !== undefined) data.outcome = parsed.outcome ?? null;
    if (parsed.finalDecision !== undefined) data.finalDecision = parsed.finalDecision ?? null;
    if (parsed.shareAnonymously !== undefined) data.shareAnonymously = parsed.shareAnonymously;
    if (parsed.shareNote !== undefined) data.shareNote = parsed.shareNote ?? null;

    const statusChanged =
      parsed.status !== undefined && parsed.status !== null && parsed.status !== existing.status;

    await prisma.case.update({
      where: { id: params.id },
      data,
    });

    if (statusChanged) {
      await prisma.caseStatusHistory.create({
        data: {
          caseId: params.id,
          orgId: user.orgId,
          status: parsed.status!,
        },
      });
    }

    const result = await getCaseById(user.orgId, params.id);
    return NextResponse.json({ case: result.case });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const existing = await prisma.case.findFirst({
      where: { id: params.id, orgId: user.orgId, deletedAt: null },
    });
    if (!existing) {
      throw new ApiError(404, "案件が見つかりません。");
    }
    await prisma.case.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ message: "deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}