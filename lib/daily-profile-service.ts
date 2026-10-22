import {prisma} from "./db";
import {buildDailyProfile,localDateKey} from "./daily-profile";

export async function getDailyProfile(userId:string,now=new Date()){
 const user=await prisma.user.findUnique({where:{id:userId},select:{timezone:true}});
 if(!user)throw Error("NOT_FOUND");
 const timeZone=user.timezone||"Europe/Berlin";
 const day=localDateKey(now,timeZone);
 const yesterday=new Date(Date.parse(day+"T00:00:00Z")-86400000);
 const start=new Date(day+"T00:00:00Z");
 // A local calendar day can span UTC offsets from -12 to +14 hours.
 const [score,check,sleepRows,workouts,enrollment]=await Promise.all([
  prisma.scoreSnapshot.findFirst({where:{userId},orderBy:{date:"desc"}}),
  prisma.dailyCheck.findUnique({where:{userId_date:{userId,date:start}},select:{energy:true,soreness:true,sleepHours:true}}),
  prisma.wearableDaily.findMany({where:{userId,date:{gte:yesterday,lte:start},sleepMinutes:{not:null}},
   orderBy:{date:"desc"},take:5,select:{date:true,sleepMinutes:true}}),
  prisma.workout.findMany({where:{userId,scheduledAt:{
   gte:new Date(now.getTime()-36*3600000),lte:new Date(now.getTime()+36*3600000)}},
   select:{id:true,title:true,scheduledAt:true,completedAt:true},orderBy:{scheduledAt:"asc"}}),
  prisma.journeyEnrollment.findFirst({where:{userId,state:{in:["ACTIVE","FINISHED"]},confirmedLevel:{not:null}},
   orderBy:{startedAt:"desc"},select:{confirmedLevel:true}})
 ]);
 // Different wearable sources can report the same date. Prefer the latest dated valid measure.
 const sleep=sleepRows.find(row=>row.date.toISOString().slice(0,10)===day)
  ??sleepRows.find(row=>row.date.toISOString().slice(0,10)===yesterday.toISOString().slice(0,10))??null;
 return buildDailyProfile({now,timeZone,score,check,sleep,workouts,confirmedLevel:enrollment?.confirmedLevel??null});
}
