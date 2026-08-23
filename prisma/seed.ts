import { PrismaClient, AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const fullName = process.env.ADMIN_SEED_NAME ?? "Super Admin";

  if (!email || !password) {
    console.log(
      "Skipping admin seed — set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD in your environment to bootstrap the first admin."
    );
    return;
  }

  if (password.length < 8) {
    throw new Error("ADMIN_SEED_PASSWORD must be at least 8 characters");
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} already exists — skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.create({
    data: { fullName, email, passwordHash, role: AdminRole.SUPER_ADMIN },
  });

  console.log(`✅ Created SUPER_ADMIN: ${email}`);
  console.log("   Log in at POST /api/admin/auth/login, then change this password.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
