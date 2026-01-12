import { PrismaClient, CaseStatus } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください。");
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const email = "demo@example.com";
  const password = "password123";
  const { data: createdUser, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !createdUser.user) {
    throw error || new Error("ユーザー作成に失敗しました。");
  }

  const org = await prisma.organization.create({
    data: {
      name: "デモ組織",
    },
  });
  const user = await prisma.user.create({
    data: {
      id: createdUser.user.id,
      name: "デモ太郎",
      email,
      role: "owner",
      orgId: org.id,
    },
  });
  await prisma.case.create({
    data: {
      id: "demo-case-1",
      orgId: org.id,
      receivedAt: new Date(),
      status: CaseStatus.INTAKE,
      customerName: "田中様",
      customerContact: "tanaka@example.com",
      manufacturer: "ACME",
      modelName: "X100",
      modelNumber: "X100-01",
      symptom: "電源が入らない",
      initialHypothesis: "電源基板故障",
      shareAnonymously: true,
      actionsTaken: "目視確認",
    },
  });
  console.log("Seed completed. Login with demo@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
