import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { listCases } from "@/lib/caseService";
import { handleApiError } from "@/lib/apiError";
import { stringify } from "csv-stringify/sync";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const filters = {
      status: url.searchParams.get("status") || undefined,
      from: url.searchParams.get("from") || undefined,
      to: url.searchParams.get("to") || undefined,
      sort: (url.searchParams.get("sort") as "asc" | "desc") || "desc",
      stalledOnly: url.searchParams.get("stalled") === "1",
    };
    const result = await listCases(user.orgId, filters);
    const records = result.cases.map((c) => ({
      id: c.id,
      status: c.status,
      receivedAt: c.receivedAt.toISOString(),
      customerName: c.customerName ?? "",
      customerContact: c.customerContact ?? "",
      manufacturer: c.manufacturer ?? "",
      modelName: c.modelName ?? "",
      modelNumber: c.modelNumber ?? "",
      symptom: c.symptom,
      outcome: c.outcome ?? "",
      finalDecision: c.finalDecision ?? "",
      shareAnonymously: c.shareAnonymously,
      ageDays: c.ageDays,
      stalled: c.stalled,
      stallThreshold: c.stallThreshold,
      stalledByDays: c.stalledByDays,
      attachmentsCount: (c as any).attachmentsCount ?? 0,
    }));
    const csv = stringify(records, {
      header: true,
      columns: [
        "id",
        "status",
        "receivedAt",
        "customerName",
        "customerContact",
        "manufacturer",
        "modelName",
        "modelNumber",
        "symptom",
        "outcome",
        "finalDecision",
        "shareAnonymously",
        "ageDays",
        "stalled",
        "stallThreshold",
        "stalledByDays",
        "attachmentsCount",
      ],
    });
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=cases.csv",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
