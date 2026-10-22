import {prisma} from "./db";
import {cycleFeatureEnabled,estimateCycle} from "./cycle-contract";
import {localDateKey} from "./daily-profile";
export const cyclePrivateHeaders={"cache-control":"private, no-store"};
export async function privateCycle(userId:string){
 if(!cycleFeatureEnabled())return {enabled:false,available:false,shareWithCoach:false,remindersEnabled:false,
  consentedAt:null,lastPeriodStart:null,cycleLengthDays:null,forecast:null,entries:[],reminder:null};
 const privacy=await prisma.cyclePrivacy.findUnique({where:{userId}});
 if(!privacy?.enabled)return {enabled:false,available:true,shareWithCoach:false,remindersEnabled:false,
  consentedAt:null,lastPeriodStart:null,cycleLengthDays:null,forecast:null,entries:[],reminder:null};
 const user=await prisma.user.findUnique({where:{id:userId},select:{timezone:true}});
 const today=localDateKey(new Date(),user?.timezone||"Europe/Berlin");
 const since=new Date(Date.parse(today+"T00:00:00Z")-119*86400000);
 const entries=await prisma.cycleJournalEntry.findMany({where:{userId,date:{gte:since}},
  orderBy:{date:"desc"},take:120,select:{id:true,date:true,flow:true,symptoms:true,energy:true,mood:true,
   discomfort:true,planChoice:true,updatedAt:true}});
 const forecast=estimateCycle({lastPeriodStart:privacy.lastPeriodStart,cycleLengthDays:privacy.cycleLengthDays,today});
 // In-app, private reminder only, not a push containing reproductive health data.
 const daysUntil=forecast?.estimatedNextStarts[0]?Math.round(
  (Date.parse(forecast.estimatedNextStarts[0]+"T00:00:00Z")-Date.parse(today+"T00:00:00Z"))/86400000):null;
 return {enabled:true,available:true,shareWithCoach:privacy.shareWithCoach,remindersEnabled:privacy.remindersEnabled,
  consentedAt:privacy.consentedAt,lastPeriodStart:privacy.lastPeriodStart?.toISOString().slice(0,10)??null,
  cycleLengthDays:privacy.cycleLengthDays,
  forecast,entries:entries.map(e=>({...e,date:e.date.toISOString().slice(0,10)})),
  reminder:privacy.remindersEnabled&&daysUntil!=null&&daysUntil<=3?{
   text:"Wenn du möchtest, kannst du deinen Zykluskalender aktualisieren.",daysUntil
  }:null};
}
