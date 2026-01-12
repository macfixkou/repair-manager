import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";
import { ApiError, handleApiError } from "@/lib/apiError";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.parse(body);
    const exists = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (exists) {
      throw new ApiError(400, "このメールアドレスは既に登録されています。");
    }

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new ApiError(500, "Supabaseの設定が不足しています。");
    }

    const supabaseAdmin = createClient(url, serviceKey);
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: parsed.email,
      password: parsed.password,
      email_confirm: true,
      user_metadata: {
        orgName: parsed.orgName,
        name: parsed.name,
      },
    });
    if (error || !data.user) {
      throw new ApiError(500, error?.message ?? "ユーザー作成に失敗しました。");
    }

    const org = await prisma.organization.create({
      data: {
        name: parsed.orgName,
      },
    });
    const user = await prisma.user.create({
      data: {
        id: data.user.id,
        name: parsed.name,
        email: parsed.email,
        role: "owner",
        orgId: org.id,
      },
    });

    return NextResponse.json({ message: "created", orgId: org.id, userId: user.id });
  } catch (error) {
    return handleApiError(error);
  }
}