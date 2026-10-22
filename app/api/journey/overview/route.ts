import {NextResponse} from "next/server";
import {requireApiUser,errorJson} from "../../../../lib/http";
import {getJourneyOverview} from "../../../../lib/journey-reader";
export async function GET(){
 const user=await requireApiUser();
 if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 if(process.env.JOURNEY_OVERVIEW_ENABLED!=="true")return errorJson("Trainingsweg noch nicht freigeschaltet.",503,"JOURNEY_NOT_ENABLED");
 const overview=await getJourneyOverview(user.id);
 return NextResponse.json({ok:true,...overview},{headers:{"cache-control":"private, no-store"}});
}
