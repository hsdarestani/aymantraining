import {NextResponse} from "next/server";
import {z} from "zod";
import {requireApiUser,errorJson} from "../../../../../lib/http";
import {getOwnedJourneyChapter} from "../../../../../lib/journey-reader";
type Context={params:Promise<{chapterId:string}>};
export async function GET(request:Request,{params}:Context){
 const user=await requireApiUser();
 if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 if(process.env.JOURNEY_OVERVIEW_ENABLED!=="true")return errorJson("Trainingsweg noch nicht freigeschaltet.",503,"JOURNEY_NOT_ENABLED");
 const {chapterId}=await params;
 const parsed=z.string().min(5).max(130).safeParse(new URL(request.url).searchParams.get("enrollmentId"));
 if(!parsed.success||chapterId.length<5||chapterId.length>130)return errorJson("Ungültige Anfrage.",422);
 try{
  const chapter=await getOwnedJourneyChapter(user.id,parsed.data,chapterId);
  return NextResponse.json({ok:true,chapter},{headers:{"cache-control":"private, no-store"}});
 }catch(e){
  if(e instanceof Error&&e.message==="LOCKED")return errorJson("Kapitel nicht freigeschaltet.",403);
  return errorJson("Kapitel nicht verfügbar.",404);
 }
}
