import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../../../lib/db";
import { errorJson, isSameOrigin, requireApiUser, dateOnly } from "../../../../lib/http";
import { recomputeScoreForUser } from "../../../../lib/scoring";
import { evaluateRecommendations } from "../../../../lib/recommendations";
import { hasFeature } from "../../../../lib/entitlements";

const schema = z.object({
  source: z.enum(["apple_health", "health_connect", "manual_import"]),
  date: z.string().date(),
  steps: z.number().int().min(0).max(200000).optional(),
  activeCalories: z.number().min(0).max(20000).optional(),
  totalCalories: z.number().min(0).max(30000).optional(),
  restingHr: z.number().min(20).max(250).optional(),
  hrv: z.number().min(0).max(500).optional(),
  sleepMinutes: z.number().int().min(0).max(1440).optional(),
  sleepStages: z.record(z.string(), z.number()).optional(),
  vo2max: z.number().min(5).max(100).optional(),
  weightKg: z.number().min(25).max(400).optional(),
  workouts: z.array(z.record(z.string(), z.unknown())).max(100).optional()
});

export async function POST(request: Request) {
  if (!isSameOrigin(request) && request.headers.get("x-bd-client") !== "mobile") return errorJson("Ungültige Anfrage.", 403);
  const user = await requireApiUser();
  if (!user) return errorJson("Nicht angemeldet.", 401);

  const consent = await prisma.consentRecord.findFirst({
    where: { userId: user.id, type: "health_data" },
    orderBy: { grantedAt: "desc" }
  });
  if (!consent?.granted) {
    return errorJson("Health-Daten dürfen erst nach ausdrücklicher Einwilligung importiert werden.", 403);
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorJson("Ungültige Health-Daten.", 422);

  const advanced = await hasFeature(user.subscriptionTier, "wearable_advanced");
  const { date: rawDate, sleepStages, workouts, ...rawValues } = parsed.data;
  const values = advanced ? rawValues : {
    source: rawValues.source,
    steps: rawValues.steps,
    activeCalories: rawValues.activeCalories,
    totalCalories: rawValues.totalCalories
  };
  const day = dateOnly(new Date(rawDate));
  const fields = [
    values.steps,
    values.activeCalories,
    values.totalCalories,
    values.restingHr,
    values.hrv,
    values.sleepMinutes,
    values.vo2max,
    values.weightKg
  ];
  const completeness = Math.round(fields.filter((v) => v != null).length / fields.length * 100);
  const jsonSleep = advanced ? sleepStages as Prisma.InputJsonValue | undefined : undefined;
  const jsonWorkouts = advanced ? workouts as Prisma.InputJsonValue | undefined : undefined;

  const item = await prisma.wearableDaily.upsert({
    where: { userId_date_source: { userId: user.id, date: day, source: values.source } },
    update: {
      ...values,
      completeness,
      ...(jsonSleep !== undefined ? { sleepStages: jsonSleep } : {}),
      ...(jsonWorkouts !== undefined ? { workouts: jsonWorkouts } : {})
    },
    create: {
      userId: user.id,
      date: day,
      ...values,
      completeness,
      ...(jsonSleep !== undefined ? { sleepStages: jsonSleep } : {}),
      ...(jsonWorkouts !== undefined ? { workouts: jsonWorkouts } : {})
    }
  });

  const [score, recommendations] = await Promise.all([
    recomputeScoreForUser(user.id),
    evaluateRecommendations(user.id)
  ]);
  return NextResponse.json({ ok: true, item, score, recommendations: advanced ? recommendations : [], advanced });
}
