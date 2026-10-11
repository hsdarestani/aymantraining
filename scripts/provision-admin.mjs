import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

// Run from the deployment host with BD_ADMIN_EMAIL and BD_ADMIN_PASSWORD set
// through GitHub Actions secrets. Never store credentials in repository files.
const prisma = new PrismaClient();
const email = String(process.env.BD_ADMIN_EMAIL || "").trim().toLowerCase();
const password = String(process.env.BD_ADMIN_PASSWORD || "");

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 8 || password.length > 128) {
  console.error("Admin provisioning requires a valid email and a 8-128 character password in private environment variables.");
  process.exit(2);
}

try {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "ADMIN") {
      throw new Error("Existing non-admin account matches the supplied email; refusing to elevate it automatically.");
    }
    console.log("ADMIN_ALREADY_EXISTS (no password or account data changed)");
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        name: "BE DIFFERENT Admin",
        role: "ADMIN",
        passwordHash,
      },
    });
    console.log("ADMIN_CREATED_SUCCESSFULLY");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Admin provisioning failed");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
