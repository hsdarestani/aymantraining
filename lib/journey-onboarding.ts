import {z} from "zod";
import {JOURNEY_LEVELS,normalizeGoalSlugs} from "./journey-contract";

export const JOURNEY_ONBOARDING_GOALS=[
  {slug:"muscle_building",label:"Muskelaufbau"},
  {slug:"fat_loss",label:"Fettabbau"},
  {slug:"athleticism",label:"Athletik"},
  {slug:"football",label:"Fußball"},
  {slug:"calisthenics",label:"Calisthenics"},
  {slug:"health",label:"Gesundheit"}
] as const;

export const JOURNEY_LEVEL_DESCRIPTIONS=[
  {code:"READY",label:"READY",description:"Du startest gerade oder steigst wieder ein. Du möchtest Grundlagen aufbauen und Schritt für Schritt in eine Trainingsroutine finden."},
  {code:"AWAKE",label:"AWAKE",description:"Du hast erste Trainingserfahrung und kennst grundlegende Übungen. Du möchtest regelmäßiger und strukturierter trainieren."},
  {code:"DIFFERENT",label:"DIFFERENT",description:"Du trainierst bereits regelmäßig und beherrschst die Grundlagen. Jetzt möchtest du gezielt an deinen ausgewählten Zielen arbeiten."},
  {code:"BE_DIFFERENT",label:"BE DIFFERENT",description:"Du trainierst fortgeschritten und strukturiert. Du suchst anspruchsvollere Inhalte und möchtest deine Leistung gezielt weiterentwickeln."},
  {code:"TRULY_DIFFERENT",label:"TRULY DIFFERENT",description:"Du verfügst über umfangreiche Trainingserfahrung und ein hohes Niveau in deinem gewählten Trainingsweg. Du möchtest anspruchsvolle Herausforderungen meistern und deine Leistung weiter verfeinern."}
] as const;

export const journeyOnboardingInput=z.object({
  goals:z.array(z.string()).min(1).max(6),
  selfLevel:z.enum(JOURNEY_LEVELS),
  dashboard:z.enum(["GENERAL","WOMEN"]).default("GENERAL")
}).strict();

export function canonicalOnboardingGoals(values:string[]){
  const allowed=new Map<string,string>();
  for(const item of JOURNEY_ONBOARDING_GOALS){
    allowed.set(item.slug,item.slug);
    allowed.set(item.label.toLowerCase(),item.slug);
  }
  const parsed=values.map(x=>allowed.get(x.trim().toLowerCase()));
  if(parsed.some(x=>!x))throw new Error("Unbekanntes Trainingsziel.");
  return normalizeGoalSlugs(parsed as string[]);
}

export function initialExperienceForLevel(level:(typeof JOURNEY_LEVELS)[number]):"STARTER"|"REGULAR"|"ADVANCED"{
  if(level==="READY")return "STARTER";
  if(level==="AWAKE"||level==="DIFFERENT")return "REGULAR";
  return "ADVANCED";
}

export function displayJourneyLevel(level:(typeof JOURNEY_LEVELS)[number]){
  return level.replaceAll("_"," ");
}
