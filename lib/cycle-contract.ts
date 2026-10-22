import {z} from "zod";

export const cycleFeatureEnabled=()=>process.env.CYCLE_JOURNAL_ENABLED==="true";
export function validDateKey(value:string):boolean{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(value+"T00:00:00.000Z");
 return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export const cycleDate=z.string().refine(validDateKey,"Ungültiges Datum.");
export const dateFromKey=(key:string)=>new Date(key+"T00:00:00.000Z");
export const cycleSymptoms=["CRAMPS","HEADACHE","FATIGUE","BLOATING","BACK_PAIN","OTHER"] as const;
export const entrySchema=z.object({
 date:cycleDate,
 flow:z.enum(["NONE","LIGHT","MEDIUM","HEAVY"]).nullable().default(null),
 symptoms:z.array(z.enum(cycleSymptoms)).max(6).default([]),
 energy:z.number().int().min(1).max(10).nullable().default(null),
 mood:z.number().int().min(1).max(10).nullable().default(null),
 discomfort:z.number().int().min(0).max(10).nullable().default(null),
 planChoice:z.enum(["AS_PLANNED","EASIER","REST"]).default("AS_PLANNED")
}).strict();
export const preferenceSchema=z.discriminatedUnion("action",[
 z.object({action:z.literal("ENABLE"),acknowledgeSensitiveData:z.literal(true)}).strict(),
 z.object({action:z.literal("UPDATE"),lastPeriodStart:cycleDate.nullable().optional(),
  cycleLengthDays:z.number().int().min(20).max(45).nullable().optional(),
  remindersEnabled:z.boolean().optional()}).strict(),
 z.object({action:z.literal("SHARE"),shareWithCoach:z.boolean(),confirmShare:z.boolean().optional()}).strict(),
 z.object({action:z.literal("DISABLE"),confirmDeletion:z.literal(true)}).strict()
]);
type ForecastInput={lastPeriodStart:Date|null|undefined;cycleLengthDays:number|null|undefined;today:string;maxCycles?:number};
const ONE_DAY=86400000;
/** Calendar estimate only, never fertility/pregnancy assessment or a training prescription. */
export function estimateCycle({lastPeriodStart,cycleLengthDays,today,maxCycles=3}:ForecastInput){
 if(!lastPeriodStart||!cycleLengthDays||!validDateKey(today)||cycleLengthDays<20||cycleLengthDays>45)return null;
 const start=lastPeriodStart.toISOString().slice(0,10);
 if(!validDateKey(start)||start>today)return null;
 const ageDays=Math.floor((dateFromKey(today).getTime()-dateFromKey(start).getTime())/ONE_DAY);
 // Don't extrapolate indefinitely if no recent period has been logged.
 if(ageDays>90)return null;
 const day=ageDays%cycleLengthDays+1;
 const upcoming=Array.from({length:Math.min(3,Math.max(1,maxCycles))},(_,i)=>
  new Date(dateFromKey(start).getTime()+(Math.floor(ageDays/cycleLengthDays)+1+i)*cycleLengthDays*ONE_DAY).toISOString().slice(0,10));
 return {day,estimatedNextStarts:upcoming,approximate:true,notForContraception:true};
}
export function dayPreference(choice:"AS_PLANNED"|"EASIER"|"REST"){
 if(choice==="REST")return "Ruhe gewünscht. Dein Plan bleibt unverändert, bis du oder dein Trainer ihn anpasst.";
 if(choice==="EASIER")return "Leichtere Einheit gewünscht. Dein Plan bleibt unverändert, bis du oder dein Trainer ihn anpasst.";
 return "Du möchtest wie geplant trainieren.";
}
