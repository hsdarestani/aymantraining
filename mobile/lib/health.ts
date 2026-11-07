import {localDay,localDayStart,sumValues as sum,latestValue as latest,sleepDuration} from "./health-values";
import {Platform} from "react-native";import {api} from "./api";
type Payload={source:"apple_health"|"health_connect";date:string;steps?:number;activeCalories?:number;totalCalories?:number;restingHr?:number;hrv?:number;sleepMinutes?:number;vo2max?:number;weightKg?:number;workouts?:Record<string,unknown>[]};
const day=()=>localDay();
async function iosSync():Promise<Payload>{const hk=await import("@kingstinct/react-native-healthkit");const read=["HKQuantityTypeIdentifierStepCount","HKQuantityTypeIdentifierActiveEnergyBurned","HKQuantityTypeIdentifierRestingHeartRate","HKQuantityTypeIdentifierHeartRateVariabilitySDNN","HKQuantityTypeIdentifierVO2Max","HKQuantityTypeIdentifierBodyMass","HKCategoryTypeIdentifierSleepAnalysis"] as any;await hk.requestAuthorization({toRead:read,toShare:[]});const endDate=new Date(),sleepStart=new Date(localDayStart().getTime()-12*60*60*1000),startDate=new Date(Date.now()-36*60*60*1000);const units:Record<string,string>={HKQuantityTypeIdentifierStepCount:"count",HKQuantityTypeIdentifierActiveEnergyBurned:"kcal",HKQuantityTypeIdentifierRestingHeartRate:"count/min",HKQuantityTypeIdentifierHeartRateVariabilitySDNN:"ms",HKQuantityTypeIdentifierVO2Max:"ml/kg*min",HKQuantityTypeIdentifierBodyMass:"kg"};const q=async(id:any)=>{try{const result:any=await hk.queryQuantitySamples(id,{unit:units[id],ascending:true,filter:{date:{startDate:["HKQuantityTypeIdentifierStepCount","HKQuantityTypeIdentifierActiveEnergyBurned"].includes(id)?localDayStart(endDate):startDate,endDate}},limit:0});return Array.isArray(result)?result:(result?.samples??[])}catch{return[]}};const [steps,active,rhr,hrv,vo2,weight]=await Promise.all([q("HKQuantityTypeIdentifierStepCount"),q("HKQuantityTypeIdentifierActiveEnergyBurned"),q("HKQuantityTypeIdentifierRestingHeartRate"),q("HKQuantityTypeIdentifierHeartRateVariabilitySDNN"),q("HKQuantityTypeIdentifierVO2Max"),q("HKQuantityTypeIdentifierBodyMass")]);let sleepMinutes:number|undefined;try{const result:any=await hk.queryCategorySamples("HKCategoryTypeIdentifierSleepAnalysis" as any,{filter:{date:{startDate:sleepStart,endDate}},limit:0});const samples=Array.isArray(result)?result:(result?.samples??[]);sleepMinutes=samples.length?sleepDuration(samples.filter((s:any)=>[1,3,4,5].includes(s.value)).map((s:any)=>({start:s.startDate,end:s.endDate}))):undefined}catch{}return{source:"apple_health",date:day(),steps:steps.length?sum(steps):undefined,activeCalories:active.length?sum(active):undefined,restingHr:latest(rhr),hrv:latest(hrv),vo2max:latest(vo2),weightKg:latest(weight),sleepMinutes};}
async function androidSync():Promise<Payload>{
 const hc=await import("react-native-health-connect");
 const status=await hc.getSdkStatus();
 if(status===hc.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED)
  throw new Error("Installiere oder aktualisiere Health Connect und versuche es erneut.");
 if(status!==hc.SdkAvailabilityStatus.SDK_AVAILABLE||!await hc.initialize())
  throw new Error("Health Connect ist auf diesem Gerät nicht verfügbar.");

 const types=["Steps","ActiveCaloriesBurned","TotalCaloriesBurned","RestingHeartRate","HeartRateVariabilityRmssd",
  "SleepSession","Vo2Max","Weight","ExerciseSession"] as const;
 const requested=types.map(recordType=>({accessType:"read" as const,recordType}));
 const granted=await hc.requestPermission(requested);
 const allowed=new Set(granted.filter(permission=>permission.accessType==="read").map(permission=>permission.recordType));
 if(allowed.size===0)throw new Error("Erlaube in Health Connect mindestens einen Messwert für BE DIFFERENT.");

 const now=new Date();
 const endTime=now.toISOString();
 const since=(start:Date)=>({operator:"between" as const,startTime:start.toISOString(),endTime});
 const today=since(localDayStart(now));
 const sleepWindow=since(new Date(localDayStart(now).getTime()-12*3600000));
 const recent=since(new Date(now.getTime()-36*3600000));
 async function read<T extends typeof types[number]>(recordType:T,timeRangeFilter=recent){
  if(!allowed.has(recordType))return [];
  try{return (await hc.readRecords(recordType,{timeRangeFilter,ascendingOrder:true,pageSize:1000})).records;}
  catch{return [];}
 }
 const dailySteps=allowed.has("Steps")?hc.aggregateRecord({recordType:"Steps",timeRangeFilter:today}).catch(()=>null):null;
 const [steps,active,total,rhr,hrv,sleep,vo2,weight,workouts]=await Promise.all([
  dailySteps,read("ActiveCaloriesBurned",today),read("TotalCaloriesBurned",today),read("RestingHeartRate"),
  read("HeartRateVariabilityRmssd"),read("SleepSession",sleepWindow),read("Vo2Max"),read("Weight"),read("ExerciseSession",today)
 ]);
 const sleepMinutes=sleepDuration(sleep.flatMap(session=>session.stages?.length
  ?session.stages.filter(stage=>[2,4,5,6].includes(stage.stage)).map(stage=>({start:stage.startTime,end:stage.endTime}))
  :[{start:session.startTime,end:session.endTime}]));
 return {source:"health_connect",date:localDay(now),steps:steps?.dataOrigins.length?steps.COUNT_TOTAL:undefined,
  activeCalories:sum(active,"energy"),totalCalories:sum(total,"energy"),restingHr:latest(rhr,"beatsPerMinute"),
  hrv:latest(hrv,"heartRateVariabilityMillis"),sleepMinutes,vo2max:latest(vo2,"vo2MillilitersPerMinuteKilogram"),
  weightKg:latest(weight,"weight"),workouts:workouts.slice(-20).map(x=>({startTime:x.startTime,endTime:x.endTime,
   exerciseType:x.exerciseType,title:x.title}))};
}
export async function syncHealth(){
 if(Platform.OS!=="ios"&&Platform.OS!=="android")throw new Error("Gesundheitsdaten lassen sich auf dem Smartphone importieren.");
 const payload=Platform.OS==="ios"?await iosSync():await androidSync();
 const measurements=[payload.steps,payload.activeCalories,payload.totalCalories,payload.restingHr,payload.hrv,payload.sleepMinutes,payload.vo2max,payload.weightKg];
 if(!measurements.some(v=>v!=null))throw new Error("Keine Messwerte freigegeben oder verfügbar. Bitte Berechtigungen auf deinem Gerät prüfen.");
 return api("/api/wearables/import",{method:"POST",body:JSON.stringify(payload)});
}