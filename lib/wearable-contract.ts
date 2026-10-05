import crypto from "node:crypto";
import {z} from "zod";
export const wearableProviders=["garmin","polar","suunto","coros","whoop","oura","fitbit"] as const;
export const providerSchema=z.enum(wearableProviders);
export const wearableDailySchema=z.object({
  date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>Number.isFinite(new Date(s+"T00:00:00Z").getTime())&&new Date(s+"T00:00:00Z").toISOString().slice(0,10)===s,"Invalid date"),
  steps:z.number().int().min(0).max(200000).optional(),activeCalories:z.number().min(0).max(30000).optional(),
  totalCalories:z.number().min(0).max(40000).optional(),restingHr:z.number().min(20).max(250).optional(),
  hrv:z.number().min(0).max(1000).optional(),sleepMinutes:z.number().int().min(0).max(1440).optional(),
  sleepStages:z.record(z.string(),z.number().min(0).max(1440)).optional(),vo2max:z.number().min(0).max(150).optional(),
  workouts:z.array(z.object({type:z.string().max(100),durationMinutes:z.number().min(0).max(1440)})).max(100).optional(),
  weightKg:z.number().min(20).max(400).optional()
}).refine(x=>Object.keys(x).some(k=>k!=="date"),"No measurements").refine(x=>new Date(x.date).getTime()<=Date.now()+86400000,"Future date");
export const wearableEventSchema=z.object({eventId:z.string().min(8).max(200),externalUserId:z.string().min(1).max(200),data:z.array(wearableDailySchema).min(1).max(31)});
export function constantEqual(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y)}
export function signature(raw:string,secret:string,timestamp:string){return crypto.createHmac("sha256",secret).update(timestamp+"."+raw).digest("hex")}
export function verifySignature(raw:string,secret:string,timestamp:string|null,sig:string|null){
  if(!timestamp||!sig||!/^\d{10,13}$/.test(timestamp))return false;
  const time=Number(timestamp)*(timestamp.length===10?1000:1);
  return Math.abs(Date.now()-time)<=300000&&constantEqual(signature(raw,secret,timestamp),sig);
}
export function completeness(data:Record<string,unknown>){const keys=["steps","activeCalories","restingHr","hrv","sleepMinutes","vo2max","weightKg"];return Math.round(keys.filter(k=>data[k]!=null).length/keys.length*100)}
export function filterWearableData(data:z.infer<typeof wearableDailySchema>,advanced:boolean){
  const {date,...values}=data;
  if(!advanced)return {steps:values.steps,activeCalories:values.activeCalories,totalCalories:values.totalCalories,completeness:completeness({steps:values.steps,activeCalories:values.activeCalories})};
  return {...values,completeness:completeness(values)};
}
