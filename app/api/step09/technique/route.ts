import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {errorJson,requireApiUser,isSameOrigin} from "../../../../lib/http";
import {submitTechniqueReview} from "../../../../lib/step09-coaching";
const input=z.object({mediaId:z.string().min(5),sourceWorkoutId:z.string().min(5).optional(),athleteNoteDe:z.string().max(1000).optional()}).strict();
export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 if(process.env.STEP09_ENABLED!=="true")return errorJson("Noch nicht freigeschaltet.",503);
 const items=await prisma.coachTechniqueReview.findMany({where:{athleteId:user.id},orderBy:{submittedAt:"desc"},take:30,
 select:{id:true,mediaId:true,status:true,athleteNoteDe:true,sourceWorkoutId:true,targetWorkoutId:true,feedbackDe:true,nextSessionCueDe:true,submittedAt:true,reviewedAt:true}});
 return NextResponse.json({ok:true,items},{headers:{"cache-control":"private, no-store"}});
}
export async function POST(request:Request){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 if(process.env.STEP09_ENABLED!=="true")return errorJson("Noch nicht freigeschaltet.",503);
 const body=input.safeParse(await request.json().catch(()=>null));
 if(!body.success)return errorJson("Ungültige Videoangaben.",422);
 try{const review=await submitTechniqueReview({athleteId:user.id,...body.data});return NextResponse.json({ok:true,review});}
 catch(error){
  const msg=error instanceof Error?error.message:"";
  return errorJson(msg==="COACH_PRO_REQUIRED"?"Persönliche Videoanalyse ist nur mit PRO verfügbar.":msg==="MEDIA_NOT_OWNED"?"Video ist nicht für dein Konto freigegeben.":msg==="COACH_NOT_ASSIGNED"?"Für dein Konto ist noch kein Trainer zugeteilt.":"Workout oder Video nicht verfügbar.",msg==="COACH_PRO_REQUIRED"?403:422);
 }
}