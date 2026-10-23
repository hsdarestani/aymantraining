import {prisma} from "./db";

function localDay(d:Date,zone:string){
  try{return new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"}).format(d)}
  catch{return d.toISOString().slice(0,10)}
}
const todayOf=(date:Date,zone:string)=>localDay(date,zone);
export async function getAthleteDay(userId:string){
 const now=new Date();
 const user=await prisma.user.findUnique({where:{id:userId},select:{id:true,timezone:true,subscriptionTier:true}});
 if(!user)throw Error("NOT_FOUND");
 const zone=user.timezone||"Europe/Berlin",today=todayOf(now,zone);
 const [workouts,check,recovery,assigned,pending,feedback,brief,recommendations]=await Promise.all([
  prisma.workout.findMany({where:{userId,scheduledAt:{gte:new Date(Date.now()-36*3600000),lte:new Date(Date.now()+72*3600000)}},
   orderBy:{scheduledAt:"asc"},select:{id:true,title:true,scheduledAt:true,completedAt:true,startedAt:true,rpe:true,notes:true},take:50}),
  prisma.dailyCheck.findMany({where:{userId,date:{gte:new Date(Date.now()-2*86400000)}},orderBy:{date:"desc"},take:3}),
  prisma.wearableDaily.findMany({where:{userId,date:{gte:new Date(Date.now()-2*86400000)}},orderBy:{date:"desc"},take:5,
   select:{date:true,sleepMinutes:true,hrv:true,restingHr:true,source:true}}),
  prisma.coachAssignment.findFirst({where:{athleteId:userId,active:true,OR:[{endsAt:null},{endsAt:{gt:now}}]},select:{coachId:true}}),
  prisma.videoFeedback.findMany({where:{athleteId:userId,status:"OPEN"},select:{id:true,createdAt:true},orderBy:{createdAt:"desc"},take:10}),
  prisma.videoFeedback.findMany({where:{athleteId:userId,status:"REVIEWED"},select:{id:true,reviewedAt:true,annotations:true,mediaId:true},orderBy:{reviewedAt:"desc"},take:5}),
  prisma.coachBrief.findFirst({where:{publishAt:{lte:now},OR:[{expiresAt:null},{expiresAt:{gt:now}}],audienceTier:{in:user.subscriptionTier==="FREE"?["FREE"]:user.subscriptionTier==="PRO"?["FREE","PRO"]:["FREE","PRO","ELITE"]}},orderBy:{publishAt:"desc"},select:{title:true,body:true,mediaId:true}}),
  prisma.recommendation.findMany({where:{userId,sourceRule:{startsWith:"COACH_TECHNIQUE:"}},orderBy:{createdAt:"desc"},take:10,
   select:{title:true,action:true,explanation:true,date:true,sourceRule:true}})
 ]);
 const todays=workouts.filter(w=>w.scheduledAt&&todayOf(w.scheduledAt,zone)===today);
 const upcoming=workouts.filter(w=>w.scheduledAt&&w.scheduledAt.getTime()>=now.getTime()&&!w.completedAt);
 const next=upcoming[0]??null;
 const completed=todays.filter(w=>w.completedAt).length;
 const active=todays.find(w=>!w.completedAt)??null;
 const latestCheck=check.find(c=>todayOf(c.date,zone)===today)??null;
 const latestSleep=recovery.find(r=>todayOf(r.date,zone)===today||todayOf(r.date,zone)===todayOf(new Date(Date.now()-86400000),zone))??null;
 const sleepMinutes=latestSleep?.sleepMinutes??(latestCheck?.sleepHours!=null?Math.round(latestCheck.sleepHours*60):null);
 const dayState=active?"TRAINING_PLANNED":todays.length&&completed===todays.length?"TRAINING_DONE":"NO_WORKOUT_SCHEDULED";
 const notes=recommendations.filter(r=>r.date&&localDay(r.date,zone)>=today).map(r=>({
   title:r.title,action:r.action,explanation:r.explanation,date:r.date.toISOString().slice(0,10)
 }));
 return {
  date:today,timeZone:zone,dayState,
  actual:{scheduledToday:todays.length,completedToday:completed,
   workout:active?{id:active.id,title:active.title,scheduledAt:active.scheduledAt}:null,
   nextWorkout:next?{id:next.id,title:next.title,scheduledAt:next.scheduledAt}:null,
   energy:latestCheck?.energy??null,soreness:latestCheck?.soreness??null,
   sleepMinutes,
   checkInDate:latestCheck?.date??null,sleepDate:latestSleep?.sleepMinutes!=null?latestSleep.date:latestCheck?.sleepHours!=null?latestCheck.date:null},
  recovery:{needsCheckIn:!latestCheck,hasSleep:sleepMinutes!=null,
   // Avoid diagnosing fatigue or overruling the athlete's own plan from incomplete data.
   note:latestCheck?.energy!=null&&latestCheck.energy<=2?
    "Du hast wenig Energie angegeben. Besprich eine Anpassung vor der nächsten intensiven Einheit mit deinem Trainer.":
    !active?"Heute ist keine weitere Trainingseinheit eingetragen. Du kannst deine Erholung dokumentieren.":
    "Berücksichtige deine Tagesform und das Feedback deines Trainers."},
  coach:{assigned:Boolean(assigned),brief,adjustments:notes,openVideos:pending.length,
   feedback:feedback.map(f=>{
    const a=f.annotations as {coachNote?:string;nextSession?:{focus?:string;advice?:string;workoutId?:string}}|null;
    return {id:f.id,reviewedAt:f.reviewedAt,coachNote:a?.coachNote??"",
      nextSession:a?.nextSession??null,mediaId:f.mediaId};
   })}
 };
}
