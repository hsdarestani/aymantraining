import {NextResponse} from "next/server";
import {requireApiUser,errorJson} from "../../../../lib/http";
import {prisma} from "../../../../lib/db";
import {coachAthleteFilter} from "../../../../lib/coach-access";
export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(!["COACH","ADMIN"].includes(user.role))return errorJson("Nur für Trainer.",403);
 if(process.env.STEP09_ENABLED!=="true")return errorJson("Noch nicht freigeschaltet.",503);
 const filter=await coachAthleteFilter(user);
 const reviews=await prisma.coachTechniqueReview.findMany({where:{...(filter.userId?{athleteId:filter.userId}:{}),status:"PENDING"},
  include:{athlete:{select:{name:true,email:true}},media:{select:{id:true}},
    sourceWorkout:{select:{title:true}}},orderBy:{submittedAt:"asc"},take:100});
 const ids=[...new Set(reviews.map(r=>r.athleteId))];
 const sessions=await prisma.workout.findMany({where:{userId:{in:ids},completedAt:null,OR:[{scheduledAt:null},{scheduledAt:{gte:new Date()}}]},
  select:{id:true,userId:true,title:true,scheduledAt:true},orderBy:{scheduledAt:"asc"},take:300});
 return NextResponse.json({ok:true,items:reviews.map(r=>({
  id:r.id,mediaId:r.media.id,athleteId:r.athleteId,athleteName:r.athlete.name||r.athlete.email,
  athleteNoteDe:r.athleteNoteDe,sourceWorkoutTitle:r.sourceWorkout?.title??null,submittedAt:r.submittedAt,
  choices:sessions.filter(w=>w.userId===r.athleteId).map(w=>({id:w.id,title:w.title,scheduledAt:w.scheduledAt}))
 }))},{headers:{"cache-control":"private, no-store"}});
}