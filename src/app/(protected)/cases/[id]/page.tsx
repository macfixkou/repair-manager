import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calcStallInfo, parseStallThresholds } from "@/lib/stall";
import CaseDetailClient from "@/components/case-detail-client";
import { serverClient } from "@/lib/supabaseServer";

type Props = {
  params: { id: string };
};

export default async function CaseDetailPage({ params }: Props) {
  const supabase = serverClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }
  const profile = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!profile) redirect("/login");

  const [caseItem, org] = await Promise.all([
    prisma.case.findFirst({
      where: { id: params.id, orgId: profile.orgId, deletedAt: null },
      include: { attachments: true, statusHistory: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.organization.findUnique({ where: { id: profile.orgId } }),
  ]);
  if (!caseItem || !org) {
    notFound();
  }

  const thresholds = parseStallThresholds(org.stallThresholdsJson);
  const stallInfo = calcStallInfo(caseItem.status, caseItem.receivedAt, thresholds, new Date());
  const serializable = {
    ...caseItem,
    receivedAt: caseItem.receivedAt.toISOString(),
    createdAt: caseItem.createdAt.toISOString(),
    updatedAt: caseItem.updatedAt.toISOString(),
    attachments: caseItem.attachments.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
    statusHistory: caseItem.statusHistory.map((h) => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
    })),
  };

  return (
    <CaseDetailClient
      initialCase={{ ...serializable, ...stallInfo }}
      stallThresholds={thresholds}
    />
  );
}