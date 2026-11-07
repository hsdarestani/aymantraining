import type {SubscriptionTier} from "@prisma/client";
import {prisma} from "./db";

export function currentCoach(userId: string, now = new Date()) {
  return prisma.coachAssignment.findFirst({
    where: {athleteId: userId, active: true, startsAt: {lte: now}, OR: [{endsAt: null}, {endsAt: {gt: now}}]},
    orderBy: {createdAt: "desc"},
    select: {coach: {select: {name: true}}},
  });
}

export function publishedCoachBrief(tier: SubscriptionTier, now = new Date()) {
  return prisma.coachBrief.findFirst({
    where: {
      publishAt: {lte: now},
      OR: [{expiresAt: null}, {expiresAt: {gt: now}}],
      audienceTier: {in: tier === "FREE" ? ["FREE"] : tier === "PRO" ? ["FREE", "PRO"] : ["FREE", "PRO", "ELITE"]},
    },
    orderBy: {publishAt: "desc"},
    select: {title: true, body: true, mediaId: true, publishAt: true, coach: {select: {name: true}}},
  });
}
