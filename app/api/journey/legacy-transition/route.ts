import {NextResponse} from "next/server";
import {z} from "zod";
import {Prisma} from "@prisma/client";
import {requireApiUser,errorJson,isSameOrigin} from "../../../../lib/http";
import {canonicalOnboardingGoals,journeyOnboardingInput} from "../../../../lib/journey-onboarding";
import {optInLegacyJourney} from "../../../../lib/journey-reader";
const input=journeyOnboardingInput.pick({goals:true,selfLevel:true}).extend({
 confirmLegacyPreservation:z.literal(true)
}).strict();
export async function POST(request:Request){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 if(process.env.JOURNEY_OVERVIEW_ENABLED!=="true")return errorJson("Trainingsweg noch nicht freigeschaltet.",503,"JOURNEY_NOT_ENABLED");
 const user=await requireApiUser();
 if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 const parsed=input.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return errorJson("Ziele, Einstiegslevel und Bestätigung fehlen.",422);
 let goals:string[];
 try{goals=canonicalOnboardingGoals(parsed.data.goals);}
 catch{return errorJson("Bitte gültige, unterschiedliche Trainingsziele auswählen.",422);}
 try{
  const intake=await optInLegacyJourney(user.id,goals,parsed.data.selfLevel);
  return NextResponse.json({ok:true,...intake},{status:201,headers:{"cache-control":"private, no-store"}});
 }catch(e){
  if(e instanceof Error&&e.message==="ALREADY_REQUESTED")return errorJson("Dein Wechsel wurde bereits erfasst.",409);
  if(e instanceof Error&&e.message==="NOT_ELIGIBLE")return errorJson("Bitte zuerst dein bisheriges Profil vervollständigen.",403);
  if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==="P2002")return errorJson("Dein Wechsel wurde bereits erfasst.",409);
  return errorJson("Wechsel konnte nicht vorgemerkt werden.",422);
 }
}
