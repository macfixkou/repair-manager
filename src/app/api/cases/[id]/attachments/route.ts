import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/apiError";
import { prisma } from "@/lib/prisma";
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_SIZE } from "@/lib/constants";
import { createClient } from "@supabase/supabase-js";

type Params = { params: { id: string } };

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const existing = await prisma.case.findFirst({
      where: { id: params.id, orgId: user.orgId, deletedAt: null },
    });
    if (!existing) {
      throw new ApiError(404, "案件が見つかりません。");
    }
    const org = await prisma.organization.findUnique({ where: { id: user.orgId } });
    if (!org) {
      throw new ApiError(404, "組織が見つかりません。");
    }
    const attachmentLimit = org.attachmentLimitPaid ?? 10;
    const existingCount = await prisma.attachment.count({
      where: { caseId: params.id, orgId: user.orgId },
    });
    if (existingCount >= attachmentLimit) {
      throw new ApiError(400, `画像は最大${attachmentLimit}枚までです。`);
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      throw new ApiError(400, "ファイルが選択されていません。");
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new ApiError(400, "JPEG/PNG/WebPのみアップロードできます。");
    }
    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_UPLOAD_SIZE) {
      throw new ApiError(400, "ファイルサイズは10MB以下にしてください。");
    }

    const buffer = Buffer.from(arrayBuffer);
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "attachments";
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      throw new ApiError(500, "Supabaseの設定が不足しています。");
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.orgId}/${params.id}-${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (uploadError) {
      throw new ApiError(500, "アップロードに失敗しました。");
    }
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
    const attachment = await prisma.attachment.create({
      data: {
        caseId: params.id,
        orgId: user.orgId,
        type: "PHOTO",
        fileName: file.name,
        filePath: publicUrlData.publicUrl,
        mimeType: file.type,
        size: buffer.length,
      },
    });
    return NextResponse.json({ attachment });
  } catch (error) {
    return handleApiError(error);
  }
}
