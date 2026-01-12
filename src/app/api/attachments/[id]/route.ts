import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/apiError";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

type Params = { params: { id: string } };

export async function DELETE(_: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const attachmentId = Number(params.id);
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, orgId: user.orgId },
    });
    if (!attachment) {
      throw new ApiError(404, "添付が見つかりません。");
    }
    await prisma.attachment.delete({ where: { id: attachmentId } });

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "attachments";
    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const url = new URL(attachment.filePath);
      const segments = url.pathname.split("/");
      const bucketIndex = segments.findIndex((seg) => seg === bucket);
      const pathInBucket =
        bucketIndex >= 0 ? segments.slice(bucketIndex + 1).join("/") : segments.slice(-1).join("/");
      if (pathInBucket) {
        await supabase.storage.from(bucket).remove([pathInBucket]).catch(() => {});
      }
    }
    return NextResponse.json({ message: "deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
