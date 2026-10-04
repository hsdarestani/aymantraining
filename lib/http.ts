import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";

export function errorJson(message: string, status = 400, code?: string) {
  return NextResponse.json({ ok: false, error: message, code }, { status });
}

export async function requireApiUser() {
  return getCurrentUser();
}

export function isSameOrigin(request: Request) {
  const mobile =
    request.headers.get("x-bd-client") === "mobile" &&
    /^Bearer\s+\S+$/i.test(request.headers.get("authorization") || "");
  if (mobile) return true;

  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function safeIpHash(request: Request) {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export function dateOnly(input = new Date()) {
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
}
