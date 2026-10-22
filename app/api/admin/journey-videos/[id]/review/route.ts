import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../../../lib/db";
import {requireApiUser,errorJson,isSameOrigin} from "../../../../../../lib/http";
import {canCoachAccess} from "../../../../../../lib/coach-access";
import {queueNotification} from "../../../../../../lib/notifications";
const schema=z.object({coachNote:z.string().trim().min(8).max(2000),
 nextSession:z.object({workoutId:z.string().min(5),focus:z.string().trim().min(3).max(140),
 advice:z.string().trim().min(8).max(1000)}).strict().nullable().default(null)}).strict();
type C={params:Promise<{id:string}>};
export async function POST(request:Request,{params}:C){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 if(process.env.JOURNEY_DAILY_ENABLED!=="true")return errorJson("Noch nicht freigegeben.",503);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="COACH"&&user.role!=="ADMIN")return errorJson("Keine Berechtigung.",403);
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorJson("Bitte eine konkrete Rückmeldung eingeben.",422);
 const {id}=await params;
 const review=await prisma.videoFeedback.findUnique({where:{id}});
 if(!review)return errorJson("Video nicht gefunden.",404);
 if(!await canCoachAccess(user,review.athleteId))return errorJson("Keine Berechtigung.",403);
 const target=parsed.data.nextSession;
 let session=null;
 if(target){
  session=await prisma.workout.findFirst({where:{
   id:target.workoutId,userId:review.athleteId,completedAt:null,
   scheduledAt:{gt:new Date()}
  },select:{id:true,scheduledAt:true,title:true}});
  if(!session||!session.scheduledAt)return errorJson("Nächste Einheit nicht vorhanden oder abgeschlossen.",409);
 }
 const result=await prisma.$transaction(async tx=>{
  const claimed=await tx.videoFeedback.updateMany({where:{id,status:"OPEN"},
   data:{status:"REVIEWED",reviewedAt:new Date(),annotations:{
    coachNote:parsed.data.coachNote,
    nextSession:target?{...target,title:session?.title,scheduledAt:session?.scheduledAt}:null
   }}});
  if(claimed.count!==1)throw new Error("ALREADY_REVIEWED");
  if(target&&session?.scheduledAt){
   const day=new Date(session.scheduledAt.toISOString().slice(0,10)+"T00:00:00.000Z");
   await tx.recommendation.create({data:{
    userId:review.athleteId,date:day,severity:"info",
    title:"Trainerfokus: "+target.focus,explanation:parsed.data.coachNote,
    action:target.advice,sourceRule:"COACH_TECHNIQUE:"+id,coachStatus:"APPROVED"
   }});
  }
  await tx.message.create({data:{athleteId:review.athleteId,coachId:user.id,senderId:user.id,
   kind:"TEXT",text:"Technikvideo geprüft: "+parsed.data.coachNote+
   (target?" | Nächste Einheit: "+target.focus+" – "+target.advice:"")}});
  return {status:"REVIEWED",id};
 }).catch(e=>{if(e instanceof Error&&e.message==="ALREADY_REVIEWED")return null;throw e;});
 if(!result)return errorJson("Video wurde bereits bewertet.",409);
 await queueNotification({userId:review.athleteId,category:"coach_message",
  title:"Dein Trainer hat dein Video geprüft",body:"Du hast eine persönliche Rückmeldung für die nächste Einheit.",
  data:{route:"/journey-today"}}).catch(()=>null);
 return NextResponse.json({ok:true,...result});
}
