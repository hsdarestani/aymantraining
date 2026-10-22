import {prisma} from "./db";
import {hasFeature} from "./entitlements";
import {canCoachAccess} from "./coach-access";
import {dateOnly} from "./http";
import {Prisma} from "@prisma/client";

const dayMs=86400000;

export async function getStep09Today(userId:string){
 const today=dateOnly(),end=new Date(today.getTime()+dayMs);
 const [user,check,wearable,todays,upcoming,reviews,enrollment]=await Promise.all([
  prisma.user.findUnique({where:{id:userId},select:{name:true,subscriptionTier:true}}),
  prisma.dailyCheck.findUnique({where:{userId_date:{userId,date:today}}}),
  prisma.wearableDaily.findFirst({where:{userId,date:{gte:new Date(today.getTime()-dayMs*2)}},orderBy:{date:"desc"}}),
  prisma.workout.findMany({where:{userId,scheduledAt:{gte:today,lt:end}},select:{id:true,title:true,scheduledAt:true,startedAt:true,completedAt:true},orderBy:{scheduledAt:"asc"}}),
  prisma.workout.findFirst({where:{userId,completedAt:null,scheduledAt:{gte:end}},select:{id:true,title:true,scheduledAt:true},orderBy:{scheduledAt:"asc"}}),
  prisma.coachTechniqueReview.findMany({where:{athleteId:userId},select:{
   id:true,status:true,sourceWorkoutId:true,targetWorkoutId:true,athleteNoteDe:true,
   feedbackDe:true,nextSessionCueDe:true,submittedAt:true,reviewedAt:true
  },orderBy:{submittedAt:"desc"},take:8}),
  prisma.journeyEnrollment.findFirst({where:{userId,state:"ACTIVE",version:{state:"PUBLISHED"}},
   select:{confirmedLevel:true,version:{select:{pathway:{select:{titleDe:true}}}},
    unlocks:{select:{chapterId:true,chapter:{select:{titleDe:true}},createdAt:true},orderBy:{createdAt:"desc"},take:4}},
   orderBy:{startedAt:"desc"}})
 ]);
 const first=todays.find(w=>!w.completedAt)??todays[0]??null;
 const next=first&&!first.completedAt?first:upcoming;
 const nextReview=reviews.find(r=>r.status==="REVIEWED"&&(
  r.targetWorkoutId? r.targetWorkoutId===next?.id : Boolean(next&&r.submittedAt<(next.scheduledAt||new Date()))
 ))??null;
 const energy=check?.energy??null,soreness=check?.soreness??null;
 // Display measurements rather than manufacturing a physiological readiness score.
 return {
  today:today.toISOString().slice(0,10),
  plan:todaySynthesis(todays),
  nextWorkout:next?{id:next.id,title:next.title,scheduledAt:next.scheduledAt}:null,
  upcomingWorkout:upcoming,
  readiness:{hasCheckin:Boolean(check),energy,soreness,mood:check?.mood??null,
    sleepHours:check?.sleepHours??(wearable?.sleepMinutes!=null?Math.round(wearable.sleepMinutes/6)/10:null),
    wearableDate:wearable?.date??null,
    note:!check?"Heute noch kein Befinden eingetragen. Es wird keine Trainingsbereitschaft geschätzt.":"Deine Angaben sind Beobachtungen, keine automatische Trainingsfreigabe."},
  coach:{hasPersonalCoach:Boolean(await prisma.coachAssignment.count({where:{athleteId:userId,active:true}})),
    canSendVideos:user?await hasFeature(user.subscriptionTier,"coach_chat"):false,
    nextSessionCueDe:nextReview?.nextSessionCueDe??null,
    feedbackDe:nextReview?.feedbackDe??null,
    appliedToWorkoutId:nextReview?.targetWorkoutId??null,
    submissions:reviews.map(r=>({...r}))},
  journey:enrollment?{titleDe:enrollment.version.pathway.titleDe,level:enrollment.confirmedLevel,
   nextEarnedChapter:enrollment.unlocks[0]?.chapter.titleDe??null}:null
 };
}
function todaySynthesis(workouts:{id:string;title:string;completedAt:Date|null;scheduledAt:Date|null}[]){
 if(!workouts.length)return {kind:"NO_WORKOUT_PLANNED",label:"Heute keine Einheit geplant",explanation:"Im Kalender ist heute keine Trainingseinheit eingetragen. Das ist keine automatisch bestätigte Ruhephase."};
 if(workouts.every(x=>x.completedAt))return {kind:"DONE",label:"Heutige Einheiten abgeschlossen",explanation:"Deine heute geplanten Trainingseinheiten sind abgeschlossen."};
 return {kind:"WORKOUT",label:"Heute steht Training an",explanation:"Dein Plan zeigt eine noch offene Trainingseinheit für heute."};
}

export async function submitTechniqueReview(args:{athleteId:string;mediaId:string;sourceWorkoutId?:string;athleteNoteDe?:string}){
 const user=await prisma.user.findUnique({where:{id:args.athleteId},select:{role:true,subscriptionTier:true}});
 if(!user||user.role!=="ATHLETE"||!await hasFeature(user.subscriptionTier,"coach_chat"))throw new Error("COACH_PRO_REQUIRED");
 const file=await prisma.mediaAsset.findFirst({where:{id:args.mediaId,ownerId:args.athleteId,
  relatedUserId:args.athleteId,kind:"TECHNIQUE_VIDEO"},select:{id:true}});
 if(!file)throw new Error("MEDIA_NOT_OWNED");
 if(args.sourceWorkoutId){
  const source=await prisma.workout.findFirst({where:{id:args.sourceWorkoutId,userId:args.athleteId},select:{id:true}});
  if(!source)throw new Error("WORKOUT_NOT_OWNED");
 }
 const coaches=await prisma.coachAssignment.count({where:{athleteId:args.athleteId,active:true}});
 if(!coaches)throw new Error("COACH_NOT_ASSIGNED");
 const existing=await prisma.coachTechniqueReview.findFirst({
  where:{athleteId:args.athleteId,mediaId:args.mediaId},select:{id:true,status:true}
 });
 if(existing)return {...existing,replayed:true};
 const review=await prisma.coachTechniqueReview.create({data:{
  athleteId:args.athleteId,mediaId:args.mediaId,sourceWorkoutId:args.sourceWorkoutId??null,
  athleteNoteDe:args.athleteNoteDe?.trim()||null
 }});
 return {id:review.id,status:review.status,replayed:false};
}
export async function reviewTechnique(args:{actor:{id:string;role:string};reviewId:string;feedbackDe:string;nextSessionCueDe?:string;targetWorkoutId?:string}){
 return prisma.$transaction(async tx=>{
  const review=await tx.coachTechniqueReview.findUnique({where:{id:args.reviewId}});
  if(!review)throw new Error("NOT_FOUND");
  if(args.actor.role!=="ADMIN"&&!await canCoachAccess(args.actor,review.athleteId))throw new Error("NOT_ASSIGNED");
  if(review.status==="REVIEWED")throw new Error("ALREADY_REVIEWED");
  if(args.targetWorkoutId){
   const workout=await tx.workout.findFirst({where:{id:args.targetWorkoutId,userId:review.athleteId,completedAt:null,
    OR:[{scheduledAt:null},{scheduledAt:{gte:new Date()}}]},select:{id:true}});
   if(!workout)throw new Error("INVALID_TARGET_WORKOUT");
  }
  const updated=await tx.coachTechniqueReview.update({where:{id:args.reviewId,status:"PENDING"},data:{
   status:"REVIEWED",reviewerId:args.actor.id,reviewedAt:new Date(),
   feedbackDe:args.feedbackDe.trim(),nextSessionCueDe:args.nextSessionCueDe?.trim()||null,
   targetWorkoutId:args.targetWorkoutId??null
  }});
  return {id:updated.id,status:updated.status,targetWorkoutId:updated.targetWorkoutId};
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}

export async function getCoachCueForWorkout(userId:string,workoutId:string,scheduledAt:Date|null){
 const candidate=await prisma.coachTechniqueReview.findFirst({where:{
  athleteId:userId,status:"REVIEWED",nextSessionCueDe:{not:null},
  OR:[{targetWorkoutId:workoutId},{targetWorkoutId:null,submittedAt:{lte:scheduledAt??new Date()}}]
 },orderBy:{reviewedAt:"desc"},select:{nextSessionCueDe:true,targetWorkoutId:true,feedbackDe:true}});
 return candidate?{text:candidate.nextSessionCueDe,coachFeedbackDe:candidate.feedbackDe,
  assignedToWorkout:candidate.targetWorkoutId===workoutId}:null;
}
