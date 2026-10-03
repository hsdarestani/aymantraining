import { prisma } from "./db";
import { dateOnly } from "./http";

export async function evaluateRecommendations(userId: string) {
  const now = new Date();
  const seven = new Date(now.getTime() - 7 * 86400000);
  const thirty = new Date(now.getTime() - 30 * 86400000);
  const [checks, wearable, workouts] = await Promise.all([
    prisma.dailyCheck.findMany({ where: { userId, date: { gte: seven } }, orderBy: { date: "desc" } }),
    prisma.wearableDaily.findMany({ where: { userId, date: { gte: thirty } }, orderBy: { date: "desc" } }),
    prisma.workout.findMany({ where: { userId, scheduledAt: { gte: seven } } })
  ]);

  const out: Array<{ severity: string; title: string; explanation: string; action: string; sourceRule: string }> = [];
  const recentSleep = wearable.slice(0, 5).map((w) => w.sleepMinutes).filter((v): v is number => v != null);
  if (recentSleep.filter((m) => m < 360).length >= 3) {
    out.push({
      severity: "warning",
      title: "Schlaf unter deinem Ziel",
      explanation: "In mindestens 3 der letzten 5 erfassten Nächte lag der Schlaf unter 6 Stunden.",
      action: "Training moderat halten und heute früher schlafen.",
      sourceRule: "sleep_low_3_of_5"
    });
  }

  const hrv = wearable.map((w) => w.hrv).filter((v): v is number => v != null).reverse();
  const rhr = wearable.map((w) => w.restingHr).filter((v): v is number => v != null).reverse();
  if (hrv.length >= 8 && rhr.length >= 8) {
    const hrvBase = hrv.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, hrv.length - 3);
    const hrvRecent = hrv.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const rhrBase = rhr.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, rhr.length - 3);
    const rhrRecent = rhr.slice(-3).reduce((a, b) => a + b, 0) / 3;
    if (hrvRecent < hrvBase * 0.88 && rhrRecent > rhrBase * 1.05) {
      out.push({
        severity: "critical",
        title: "Recovery-Signale niedrig",
        explanation: "HRV liegt unter deinem persönlichen Trend und Ruhepuls gleichzeitig darüber.",
        action: "Recovery-Tag prüfen. Der Coach entscheidet final über Planänderungen.",
        sourceRule: "hrv_rhr_recovery"
      });
    }
  }

  const missed = workouts.filter((w) => w.scheduledAt && w.scheduledAt < now && !w.completedAt).length;
  if (missed >= 2) {
    out.push({
      severity: "info",
      title: "Zwei Einheiten verpasst",
      explanation: "In den letzten 7 Tagen wurden mindestens zwei geplante Workouts nicht abgeschlossen.",
      action: "Wochenplan mit dem Coach realistisch neu abstimmen.",
      sourceRule: "missed_workouts"
    });
  }

  const lowEnergy = checks.slice(0, 3).filter((c) => (c.energy ?? 10) <= 4).length;
  if (lowEnergy >= 2) {
    out.push({
      severity: "warning",
      title: "Energie mehrfach niedrig",
      explanation: "Dein subjektives Energielevel war in mehreren aktuellen Check-ins niedrig.",
      action: "Belastung heute kontrollieren und Recovery priorisieren.",
      sourceRule: "subjective_energy_low"
    });
  }

  const today = dateOnly(now);
  await prisma.recommendation.deleteMany({ where: { userId, date: today, coachStatus: "PENDING" } });
  for (const rec of out) {
    await prisma.recommendation.create({ data: { userId, date: today, ...rec } });
  }
  return out;
}
