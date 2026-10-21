import {z} from "zod";
import {JOURNEY_LEVELS,journeyCriteriaSchema,journeyRetestSchema,normalizeGoalSlugs} from "./journey-contract";
import {JOURNEY_ONBOARDING_GOALS,JOURNEY_LEVEL_DESCRIPTIONS} from "./journey-onboarding";

export const journeyGoals=JOURNEY_ONBOARDING_GOALS;
const goalOptions=new Set<string>(journeyGoals.map(g=>g.slug));
export const journeyGoalsSchema=z.array(z.string()).min(1).max(6).superRefine((goals,ctx)=>{
  try{
    const normalized=normalizeGoalSlugs(goals);
    if(normalized.some(x=>!goalOptions.has(x)))throw Error("Unbekanntes Ziel");
  }catch{ctx.addIssue({code:"custom",message:"Bitte gültige, unterschiedliche Ziele auswählen."});}
});
export const journeyPathwayCreateSchema=z.object({
  titleDe:z.string().trim().min(3).max(120),
  description:z.string().trim().max(2000).default(""),
  goals:journeyGoalsSchema
}).strict();

const media=z.object({
  role:z.enum(["START_IMAGE","MIDDLE_IMAGE","END_IMAGE","EXPLANATION_VIDEO"]),
  presenter:z.enum(["COACH","TRAINER"]),
  mediaAssetId:z.string().min(10).max(130),
  durationSec:z.number().int().min(8).max(12).nullable().optional()
}).strict();

const item=z.object({
  kind:z.enum(["EXERCISE","TRAINING_PLAN","GUIDANCE"]),
  titleDe:z.string().trim().min(2).max(140),
  description:z.string().trim().max(2000),
  exerciseId:z.string().trim().min(1).max(130).nullable(),
  trainingPlanId:z.string().trim().min(1).max(130).nullable(),
  mandatory:z.boolean(),
  media:z.array(media).max(12)
}).strict().superRefine((v,ctx)=>{
  if(v.kind==="EXERCISE"&&!v.exerciseId)ctx.addIssue({code:"custom",message:"Bitte eine Übung zuordnen."});
  if(v.kind==="TRAINING_PLAN"&&!v.trainingPlanId)ctx.addIssue({code:"custom",message:"Bitte einen Trainingsplan zuordnen."});
  if(v.kind==="GUIDANCE"&&(v.exerciseId||v.trainingPlanId))ctx.addIssue({code:"custom",message:"Ein Hinweis darf keine Übung oder einen Plan zugeordnet haben."});
  const roles=new Set<string>();
  for(const [i,m] of v.media.entries()){
    const key=m.role+"/"+m.presenter;
    if(roles.has(key))ctx.addIssue({code:"custom",path:["media",i],message:"Gleiche Medienrolle und Trainerin doppelt."});
    roles.add(key);
    if(m.role==="EXPLANATION_VIDEO"&&m.durationSec==null)
      ctx.addIssue({code:"custom",path:["media",i,"durationSec"],message:"Videodauer muss 8 bis 12 Sekunden betragen."});
    if(m.role!=="EXPLANATION_VIDEO"&&m.durationSec!=null)
      ctx.addIssue({code:"custom",path:["media",i,"durationSec"],message:"Bilder haben keine Videodauer."});
  }
});
export const assessmentInput=z.object({
  titleDe:z.string().trim().min(3).max(140),
  criteria:journeyCriteriaSchema,
  retestRules:journeyRetestSchema.nullable(),
  approved:z.boolean()
}).strict();

const chapter=z.object({
  titleDe:z.string().trim().min(3).max(140),
  description:z.string().trim().max(2000),
  plannedDurationDays:z.number().int().min(1).max(365).nullable(),
  items:z.array(item).max(75),
  test:assessmentInput.nullable()
}).strict();

const level=z.object({
  code:z.enum(JOURNEY_LEVELS),
  description:z.string().trim().max(1200),
  chapters:z.array(chapter).max(30)
}).strict();

export const curriculumDraftSchema=z.object({
  revision:z.string().datetime(),
  notes:z.string().trim().max(1500),
  levels:z.array(level).length(5),
  placement:assessmentInput.nullable()
}).strict().superRefine((v,ctx)=>{
  for(let i=0;i<5;i++)if(v.levels[i].code!==JOURNEY_LEVELS[i])
    ctx.addIssue({code:"custom",path:["levels",i,"code"],message:"Alle fünf Level müssen in der festgelegten Reihenfolge stehen."});
});

export type CurriculumDraft=z.infer<typeof curriculumDraftSchema>;
export type CurriculumLevel=CurriculumDraft["levels"][number];
export function emptyCurriculum(){
  return JOURNEY_LEVEL_DESCRIPTIONS.map(l=>({code:l.code,description:l.description,chapters:[] as CurriculumLevel["chapters"]}));
}
export function validatePublishableDraft(v:Omit<CurriculumDraft,"revision">):string[]{
  const errors:string[]=[];
  for(const l of v.levels){
    if(!l.chapters.length)errors.push(l.code+": Mindestens ein Trainingskapitel erforderlich.");
    for(const ch of l.chapters){
      if(!ch.items.length)errors.push(l.code+" / "+ch.titleDe+": Mindestens ein Kapitelinhalt erforderlich.");
      if(!ch.test||!ch.test.approved)errors.push(l.code+" / "+ch.titleDe+": Ein fachlich freigegebener Abschlusstest ist erforderlich.");
      for(const it of ch.items){
        if(it.kind==="EXERCISE"){
          if(!it.description.trim())errors.push(ch.titleDe+" / "+it.titleDe+": Schriftliche Anleitung für FREE fehlt.");
          if(!it.media.some(m=>m.role==="START_IMAGE"))errors.push(ch.titleDe+" / "+it.titleDe+": Übungsbild für FREE fehlt.");
          if(!it.media.some(m=>m.role==="EXPLANATION_VIDEO"))errors.push(ch.titleDe+" / "+it.titleDe+": PRO Erklärvideo fehlt.");
        }
      }
    }
  }
  return errors;
}
