import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { ApiError, handleApiError } from "@/lib/apiError";
import { routeClient } from "@/lib/supabaseServer";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.parse(body);
    const supabase = routeClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.email,
      password: parsed.password,
    });
    if (error || !data.session) {
      return NextResponse.json({ error: "メールまたはパスワードが違います。" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (!user) {
      throw new ApiError(403, "ユーザー情報が見つかりません。再ログインしてください。");
    }
    return NextResponse.json({ message: "ok" });
  } catch (error) {
    return handleApiError(error);
  }
}