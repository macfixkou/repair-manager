import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createCaseSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { listCases } from "@/lib/caseService";
import { parseDate } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const filters = {
      query: url.searchParams.get("query") || undefined,
      status: url.searchParams.get("status") || undefined,
      from: url.searchParams.get("from") || undefined,
      to: url.searchParams.get("to") || undefined,
      sort: (url.searchParams.get("sort") as "asc" | "desc") || "desc",
      stalledOnly: url.searchParams.get("stalled") === "1",
    };
    const result = await listCases(user.orgId, filters);
    return NextResponse.json({ cases: result.cases });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = createCaseSchema.parse(body);
    const data = {
      orgId: user.orgId,
      receivedAt: parseDate(parsed.receivedAt, "受付日"),
      assigneeUserId: parsed.assigneeUserId ?? null,
      status: parsed.status,
      customerName: parsed.customerName || null,
      customerContact: parsed.customerContact || null,
      customerNote: parsed.customerNote || null,
      manufacturer: parsed.manufacturer || null,
      modelName: parsed.modelName || null,
      modelNumber: parsed.modelNumber || null,
      boardNumber: parsed.boardNumber || null,
      symptom: parsed.symptom,
      initialHypothesis: parsed.initialHypothesis || null,
      actionsTaken: parsed.actionsTaken || null,
      measurements: parsed.measurements || null,
      notDone: parsed.notDone || null,
      notDoneReason: parsed.notDoneReason || null,
      outcome: parsed.outcome || null,
      finalDecision: parsed.finalDecision || null,
      shareAnonymously: parsed.shareAnonymously ?? false,
      shareNote: parsed.shareNote || null,
    };
    const created = await prisma.case.create({ data });
    await prisma.caseStatusHistory.create({
      data: {
        caseId: created.id,
        orgId: user.orgId,
        status: created.status,
      },
    });
    return NextResponse.json({ case: created });
  } catch (error) {
    return handleApiError(error);
  }
}
