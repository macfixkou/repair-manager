import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/apiError";
import { prisma } from "@/lib/prisma";
import { parseStallThresholds } from "@/lib/stall";
import { orgSettingsSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const DEFAULT_ATTACHMENT_LIMIT_FREE = 5;
const DEFAULT_ATTACHMENT_LIMIT_PAID = 10;

function isMissingColumnError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022") {
    return true;
  }
  const message = (error as { message?: string } | null)?.message ?? "";
  return message.includes("attachmentLimit") || message.includes("column") || message.includes("P2022");
}

async function fetchStallThresholdsRaw(orgId: number) {
  try {
    const rows = await prisma.$queryRaw<{ stallThresholdsJson: string }[]>`
      SELECT "stallThresholdsJson" FROM "Organization" WHERE id = ${orgId}
    `;
    const row = rows[0];
    if (!row) {
      throw new ApiError(404, "組織が見つかりません。");
    }
    return parseStallThresholds(row.stallThresholdsJson);
  } catch (error) {
    console.warn("Failed to load stallThresholdsJson, using defaults.", error);
    return parseStallThresholds(null);
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    try {
      const org = await prisma.organization.findUnique({ where: { id: user.orgId } });
      if (!org) {
        throw new ApiError(404, "組織が見つかりません。");
      }
      return NextResponse.json({
        stallThresholds: parseStallThresholds(org.stallThresholdsJson),
        attachmentLimitFree: org.attachmentLimitFree,
        attachmentLimitPaid: org.attachmentLimitPaid,
      });
    } catch (error) {
      if (!isMissingColumnError(error)) {
        throw error;
      }
      const stallThresholds = await fetchStallThresholdsRaw(user.orgId);
      return NextResponse.json({
        stallThresholds,
        attachmentLimitFree: DEFAULT_ATTACHMENT_LIMIT_FREE,
        attachmentLimitPaid: DEFAULT_ATTACHMENT_LIMIT_PAID,
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = orgSettingsSchema.parse(body);
    try {
      const org = await prisma.organization.findUnique({ where: { id: user.orgId } });
      if (!org) {
        throw new ApiError(404, "組織が見つかりません。");
      }
      const { attachmentLimitFree, attachmentLimitPaid, ...thresholdValues } = parsed;
      const merged = { ...parseStallThresholds(org.stallThresholdsJson), ...thresholdValues };
      const data: Record<string, unknown> = { stallThresholdsJson: JSON.stringify(merged) };
      if (attachmentLimitFree !== undefined) {
        data.attachmentLimitFree = attachmentLimitFree;
      }
      if (attachmentLimitPaid !== undefined) {
        data.attachmentLimitPaid = attachmentLimitPaid;
      }
      const updated = await prisma.organization.update({
        where: { id: user.orgId },
        data,
      });
      return NextResponse.json({
        stallThresholds: merged,
        attachmentLimitFree: updated.attachmentLimitFree,
        attachmentLimitPaid: updated.attachmentLimitPaid,
      });
    } catch (error) {
      if (!isMissingColumnError(error)) {
        throw error;
      }
      const stallThresholds = await fetchStallThresholdsRaw(user.orgId);
      const { attachmentLimitFree, attachmentLimitPaid, ...thresholdValues } = parsed;
      const merged = { ...stallThresholds, ...thresholdValues };
      await prisma.$executeRaw`
        UPDATE "Organization"
        SET "stallThresholdsJson" = ${JSON.stringify(merged)}
        WHERE id = ${user.orgId}
      `;
      return NextResponse.json({
        stallThresholds: merged,
        attachmentLimitFree: attachmentLimitFree ?? DEFAULT_ATTACHMENT_LIMIT_FREE,
        attachmentLimitPaid: attachmentLimitPaid ?? DEFAULT_ATTACHMENT_LIMIT_PAID,
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
