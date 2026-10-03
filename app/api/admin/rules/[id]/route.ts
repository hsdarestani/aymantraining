import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../../../../lib/db";
import { requireRole } from "../../../../../lib/auth";
import { errorJson, isSameOrigin } from "../../../../../lib/http";

const schema = z.object({
  enabled: z.boolean().optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  conditions: z.record(z.string(), z.unknown()).optional(),
  action: z.record(z.string(), z.unknown()).optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole(["COACH", "ADMIN"]);
  if (!isSameOrigin(request)) return errorJson("Ungültige Anfrage.", 403);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorJson("Ungültige Regel.", 422);
  const { id } = await params;

  const data: Prisma.CoachingRuleUpdateInput = {};
  if (parsed.data.enabled !== undefined) data.enabled = parsed.data.enabled;
  if (parsed.data.priority !== undefined) data.priority = parsed.data.priority;
  if (parsed.data.conditions !== undefined) data.conditions = parsed.data.conditions as Prisma.InputJsonValue;
  if (parsed.data.action !== undefined) data.action = parsed.data.action as Prisma.InputJsonValue;

  const item = await prisma.coachingRule.update({ where: { id }, data });
  return NextResponse.json({ ok: true, item });
}
