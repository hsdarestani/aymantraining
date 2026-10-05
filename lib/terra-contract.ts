import crypto from 'node:crypto';
import {providerSchema,verifySignature,wearableDailySchema} from './wearable-contract';
export function verifyTerraSignature(raw:string,secret:string,header:string|null){const parts=(header??'').split(',').map(x=>x.trim().split('='));const timestamp=parts.find(x=>x[0]==='t')?.[1]??null;return parts.some(x=>x[0]==='v1'&&verifySignature(raw,secret,timestamp,x[1]));}
export function terraProvider(value:unknown){return providerSchema.parse(typeof value==='string'?value.toLowerCase():value)}
export function normalizeTerraPayload(payload:any){
 if(!['daily','sleep','body','activity'].includes(payload?.type)||!Array.isArray(payload.data)||payload.data.length>31)throw Error('Invalid Terra data');
 const days=new Map<string,any>();
 for(const x of payload.data){
  const timestamp=payload.type==='sleep'?x?.metadata?.end_time:x?.metadata?.start_time;
  if(typeof timestamp!=='string'||!Number.isFinite(Date.parse(timestamp)))throw Error('Invalid Terra date');
  const date=timestamp.slice(0,10),value=days.get(date)??{date};
  const number=(key:string,n:unknown)=>{if(typeof n==='number'&&Number.isFinite(n))value[key]=n};
  const hr=x.heart_rate_data?.summary??x.heart_data?.heart_rate_data?.summary;
  number('restingHr',hr?.resting_hr_bpm);number('hrv',hr?.avg_hrv_rmssd??hr?.avg_hrv_sdnn);
  number('vo2max',x.oxygen_data?.vo2max_ml_per_min_per_kg??x.oxygen_data?.day_avg_vo2max_ml_per_min_per_kg);
  if(payload.type==='daily'){number('steps',x.distance_data?.steps);number('activeCalories',x.calories_data?.net_activity_calories);number('totalCalories',x.calories_data?.total_burned_calories)}
  if(payload.type==='body')number('weightKg',x.measurements_data?.day_avg_weight_kg);
  if(payload.type==='sleep'){
   const asleep=x.sleep_durations_data?.asleep;
   if(typeof asleep?.duration_asleep_state_seconds==='number')value.sleepMinutes=(value.sleepMinutes??0)+Math.round(asleep.duration_asleep_state_seconds/60);
   const stages:any={};for(const [name,key] of [['deep','duration_deep_sleep_state_seconds'],['light','duration_light_sleep_state_seconds'],['rem','duration_REM_sleep_state_seconds']])if(typeof asleep?.[key]==='number')stages[name]=asleep[key]/60;
   if(Object.keys(stages).length)value.sleepStages={...value.sleepStages,...stages};
  }
  if(payload.type==='activity'&&typeof x.active_durations_data?.activity_seconds==='number')value.workouts=[...(value.workouts??[]),{type:String(x.metadata?.name??x.metadata?.type??'activity').slice(0,100),durationMinutes:x.active_durations_data.activity_seconds/60}];
  days.set(date,value);
 }
 return [...days.values()].filter(x=>Object.keys(x).length>1).map(x=>wearableDailySchema.parse(x));
}
export function terraEventId(raw:string){return 'terra-'+crypto.createHash('sha256').update(raw).digest('hex')}
