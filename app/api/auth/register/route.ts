import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../../../lib/db";
import { createSession, hashPassword, SESSION_COOKIE } from "../../../../lib/auth";
import { errorJson, isSameOrigin } from "../../../../lib/http";

const schema = z.object({
  email: z.string().email().max(254).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(10).max(128),
  name: z.string().trim().min(2).max(80),
  goal: z.string().trim().min(2).max(80).optional()
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorJson("Ungültige Anfrage.", 403);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorJson("Bitte prüfe deine Angaben.", 422);

  try {
    const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (exists) return errorJson("Für diese E Mail existiert bereits ein Konto.", 409);

    const passwordHash = await hashPassword(parsed.data.password);
    const starter = await prisma.trainingPlan.findUnique({
      where: { id: "starter-athlete-base" },
      include: { items: { orderBy: [{ dayIndex: "asc" }, { orderIndex: "asc" }] } }
    });

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: parsed.data.email,
          passwordHash,
          name: parsed.data.name,
          goals: parsed.data.goal ? { create: { type: parsed.data.goal } } : undefined
        }
      });

      if (starter) {
        await tx.planAssignment.create({ data: { userId: created.id, planId: starter.id } });

        const trainingDays = [...new Set(starter.items.map((item) => item.dayIndex))]
          .sort((a, b) => a - b)
          .slice(0, 3);

        for (const [sessionIndex, dayIndex] of trainingDays.entries()) {
          const dayItems = starter.items.filter((item) => item.dayIndex === dayIndex);
          if (!dayItems.length) continue;

          const scheduledAt = new Date();
          scheduledAt.setDate(scheduledAt.getDate() + dayIndex);
          scheduledAt.setHours(18, 0, 0, 0);

          await tx.workout.create({
            data: {
              userId: created.id,
              trainingPlanId: starter.id,
              title: `Athlete Base · Session ${String.fromCharCode(65 + sessionIndex)}`,
              scheduledAt,
              exercises: {
                create: dayItems.map((item, itemIndex) => ({
                  exerciseId: item.exerciseId,
                  orderIndex: itemIndex,
                  targetSets: item.targetSets,
                  targetReps: item.targetReps,
                  targetRpe: item.targetRpe,
                  restSeconds: item.restSeconds,
                  notes: item.notes
                }))
              }
            }
          });
        }
      }

      return created;
    });

    const { token, expiresAt } = await createSession(user.id);
    const mobile = request.headers.get("x-bd-client") === "mobile";
    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, tier: user.subscriptionTier },
      ...(mobile ? { sessionToken: token, expiresAt: expiresAt.toISOString() } : {})
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt
    });

    return response;
  } catch (error) {
    console.error("registration_failed", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorJson("Für diese E Mail existiert bereits ein Konto.", 409);
    }
    return errorJson("Registrierung konnte nicht abgeschlossen werden. Bitte versuche es erneut.", 500);
  }
}
