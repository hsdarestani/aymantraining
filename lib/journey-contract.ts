import {z} from "zod";

/** Stable ordering; never derive earned levels from BE DIFFERENT SCORE. */
export const JOURNEY_LEVELS = ["READY","AWAKE","DIFFERENT","BE_DIFFERENT","TRULY_DIFFERENT"] as const;
export type EarnedLevel = typeof JOURNEY_LEVELS[number];
export const levelIndex = (level:EarnedLevel) => JOURNEY_LEVELS.indexOf(level);
export const validTier = z.enum(["FREE","PRO","ELITE"]);

export const metricRuleSchema=z.object({
  key:z.string().min(1).max(80).regex(/^[a-zA-Z0-9_]+$/),
  unit:z.string().min(1).max(32),
  min:z.number().finite().optional(),
  max:z.number().finite().optional()
}).strict().refine(x=>x.min!==undefined||x.max!==undefined,{message:"Mindestens eine Grenze erforderlich."})
  .refine(x=>x.min===undefined||x.max===undefined||x.min<=x.max,{message:"Grenzen in falscher Reihenfolge."});

export const journeyCriteriaSchema=z.object({
  schemaVersion:z.literal(1),
  metrics:z.array(metricRuleSchema).min(1).max(30),
  // A coach must have reviewed and explicitly approved the test definition
  // in the database before any test results can award chapters.
}).strict().superRefine((v,ctx)=>{
  const seen=new Set<string>();
  for(const [i,rule] of v.metrics.entries()){
    if(seen.has(rule.key))ctx.addIssue({code:"custom",path:["metrics",i,"key"],message:"Metrik mehrfach vorhanden."});
    seen.add(rule.key);
  }
});

export const journeyResultsSchema=z.array(z.object({
  key:z.string().min(1).max(80),
  unit:z.string().min(1).max(32),
  value:z.number().finite()
}).strict()).min(1).max(30).superRefine((v,ctx)=>{
  const seen=new Set<string>();
  for(const [i,result] of v.entries()){
    if(seen.has(result.key))ctx.addIssue({code:"custom",path:[i,"key"],message:"Metrik mehrfach vorhanden."});
    seen.add(result.key);
  }
});

export const journeyRetestSchema=z.object({
  minHoursAfterFailure:z.number().int().min(0).max(24*365).default(0),
  guidanceDe:z.string().max(2000).optional()
}).strict();

export type JourneyCriteria=z.infer<typeof journeyCriteriaSchema>;
export type JourneyResults=z.infer<typeof journeyResultsSchema>;

export function assessJourneyResults(criteria:JourneyCriteria,results:JourneyResults){
  const byKey=new Map(results.map(r=>[r.key,r]));
  const missing:string[]=[];
  const failed:{key:string;expected:string;actual:number|null}[]=[];
  for(const rule of criteria.metrics){
    const result=byKey.get(rule.key);
    if(!result||result.unit!==rule.unit){missing.push(rule.key);continue;}
    if((rule.min!==undefined&&result.value<rule.min)||(rule.max!==undefined&&result.value>rule.max)){
      failed.push({key:rule.key,expected:[rule.min!==undefined?">= "+rule.min:null,rule.max!==undefined?"<= "+rule.max:null].filter(Boolean).join(", "),actual:result.value});
    }
  }
  return {passed:missing.length===0&&failed.length===0,missing,failed};
}

export function canOpenJourneyMedia(params:{
  earnedChapter:boolean; tier:"FREE"|"PRO"|"ELITE"; minTier:"FREE"|"PRO"|"ELITE";
}):boolean{
  if(!params.earnedChapter)return false;
  const tiers={FREE:0,PRO:1,ELITE:2};
  return tiers[params.tier]>=tiers[params.minTier];
}

export function normalizeGoalSlugs(goals:string[]){
  const normalized=[...new Set(goals.map(x=>x.trim().toLowerCase()))].sort();
  if(normalized.length!==goals.length||normalized.length<1||normalized.length>8||normalized.some(x=>!/^[a-z0-9_]+$/.test(x))){
    throw new Error("Ungültige oder doppelte Ziele.");
  }
  return normalized;
}
