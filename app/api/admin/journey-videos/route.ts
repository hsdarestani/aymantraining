import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
import {requireApiUser,errorJson} from "../../../../lib/http";
export async function GET(){
 if(process.env.JOURNEY_DAILY_ENABLED!=="true")return errorJson("Noch nicht freigegeben.",503);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="COACH"&&user.role!=="ADMIN")return errorJson("Keine Berechtigung.",403);
 const rows=await prisma.videoFeedback.findMany({where:{
  status:"OPEN",...(user.role==="COACH"?{athleteId:{in:(await prisma.coachAssignment.findMany({
   where:{coachId:user.id,active:true,OR:[{endsAt:null},{endsAt:{gt:new Date()}}]},
   select:{athleteId:true}})).map(x=>x.athleteId)}}:{})
 },orderBy:{createdAt:"asc"},take:100});
 const athleteIds=[...new Set(rows.map(x=>x.athleteId))];
 const [users,workouts]=await Promise.all([
  prisma.user.findMany({where:{id:{in:athleteIds}},select:{id:true,name:true}}),
  prisma.workout.findMany({where:{userId:{in:athleteIds},scheduledAt:{gt:new Date()},completedAt:null},
   orderBy:{scheduledAt:"asc"},take:150,select:{id:true,userId:true,title:true,scheduledAt:true}})
 ]);
 return NextResponse.json({ok:true,videos:rows.map(x=>({
   id:x.id,athleteId:x.athleteId,athlete:users.find(u=>u.id===x.athleteId)?.name??"Athlet",
   mediaId:x.mediaId,createdAt:x.createdAt,annotations:x.annotations,
   upcoming:workouts.filter(w=>w.userId===x.athleteId).slice(0,8).map(w=>({id:w.id,title:w.title,scheduledAt:w.scheduledAt}))
  }))},{headers:{"cache-control":"private, no-store"}});
}
