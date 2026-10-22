import {NextResponse} from "next/server";
import {requireApiUser,errorJson} from "../../../../lib/http";
import {getAthleteDay} from "../../../../lib/journey-daily";
export async function GET(){
 if(process.env.JOURNEY_DAILY_ENABLED!=="true")return errorJson("Deine Tagesansicht ist noch nicht freigegeben.",503);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 try{return NextResponse.json({ok:true,...await getAthleteDay(user.id)},{headers:{"cache-control":"private, no-store"}})}
 catch{return errorJson("Dein Trainingsstand konnte nicht geladen werden.",503)}
}
