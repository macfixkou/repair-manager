import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/apiError";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const item = await prisma.case.findFirst({
      where: { id: params.id, orgId: user.orgId, deletedAt: null },
    });
    if (!item) {
      throw new ApiError(404, "案件が見つかりません。");
    }
    if (!item.shareAnonymously) {
      throw new ApiError(403, "匿名共有が許可されていません。");
    }
    const payload = {
      device: {
        manufacturer: item.manufacturer,
        modelName: item.modelName,
        modelNumber: item.modelNumber,
        boardNumber: item.boardNumber,
      },
      symptom: item.symptom,
      logs: {
        initialHypothesis: item.initialHypothesis,
        actionsTaken: item.actionsTaken,
        measurements: item.measurements,
        notDone: item.notDone,
        notDoneReason: item.notDoneReason,
      },
      result: {
        status: item.status,
        outcome: item.outcome,
        finalDecision: item.finalDecision,
      },
      shareNote: item.shareNote,
    };
    return NextResponse.json(payload);
  } catch (error) {
    return handleApiError(error);
  }
}
