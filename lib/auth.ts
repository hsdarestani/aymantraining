import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {cache} from "react";
import { prisma } from "./db";

export const SESSION_COOKIE = "bd_session";
const SESSION_DAYS = 30;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.authSession.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  return { token, expiresAt };
}

export async function revokeSession(token?: string | null) {
  if (!token) return;
  await prisma.authSession.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export function sessionCookie(expiresAt: Date) {
  return {
    name: SESSION_COOKIE,
    value: "",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      expires: expiresAt
    }
  };
}

async function currentToken() {
  const headerStore = await headers();
  const authorization = headerStore.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const bearer = authorization.slice(7).trim();
    if (bearer) return bearer;
  }
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export const getCurrentUser = cache(async function getCurrentUser() {
  const token = await currentToken();
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = await prisma.authSession.findUnique({ where: { tokenHash }, include: { user: true } });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.authSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (session.lastSeenAt.getTime() < Date.now() - 6 * 60 * 60 * 1000) {
    await prisma.authSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => undefined);
  }
  return session.user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Array<"COACH" | "ADMIN">) {
  const user = await requireUser();
  if (!roles.includes(user.role as "COACH" | "ADMIN")) redirect("/dashboard");
  return user;
}

export async function purgeExpiredSessions() {
  return prisma.authSession.deleteMany({ where: { expiresAt: { lte: new Date() } } });
}
