import type { SubscriptionTier } from "@prisma/client";
import { prisma } from "./db";

export const DEFAULT_FLAGS: Record<string, { free: boolean; pro: boolean; elite: boolean }> = {
  workout_tracking: { free: true, pro: true, elite: true },
  exercise_library_full: { free: false, pro: true, elite: true },
  unlimited_history: { free: false, pro: true, elite: true },
  coach_radar_full: { free: false, pro: true, elite: true },
  coach_chat: { free: false, pro: true, elite: true },
  video_feedback: { free: false, pro: true, elite: true },
  weekly_report_full: { free: false, pro: true, elite: true },
  performance_timeline: { free: false, pro: true, elite: true }
};

export async function hasFeature(tier: SubscriptionTier, key: string) {
  const stored = await prisma.featureFlag.findUnique({ where: { key } });
  const flag = stored ?? DEFAULT_FLAGS[key];
  if (!flag) return false;
  if (tier === "ELITE") return flag.elite;
  if (tier === "PRO") return flag.pro;
  return flag.free;
}
