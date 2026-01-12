import { routeClient } from "./supabaseServer";
import { ApiError } from "./apiError";
import { prisma } from "./prisma";

export type SessionUser = {
  id: string;
  orgId: number;
  role: string;
  name?: string | null;
  email?: string | null;
};

export async function requireUser(): Promise<SessionUser> {
  const supabase = routeClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session) {
    throw new ApiError(401, "ログインが必要です。");
  }

  const authUser = session.user;
  const email = authUser.email ?? null;
  let user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user) {
    if (!email) {
      throw new ApiError(403, "ユーザー情報が見つかりません。");
    }
    const orgName =
      (authUser.user_metadata?.orgName as string | undefined) ??
      email.split("@")[0] ??
      "新規組織";
    const name =
      (authUser.user_metadata?.name as string | undefined) ??
      email ??
      "ユーザー";
    const org = await prisma.organization.create({
      data: { name: orgName },
    });
    user = await prisma.user.create({
      data: {
        id: authUser.id,
        name,
        email,
        role: "owner",
        orgId: org.id,
      },
    });
  }

  return {
    id: user.id,
    orgId: user.orgId,
    role: user.role,
    name: user.name,
    email: user.email,
  };
}
