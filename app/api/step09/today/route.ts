import {NextResponse} from "next/server";
import {requireApiUser,errorJson} from "../../../../lib/http";
import {getStep09Today} from "../../../../lib/step09-coaching";
export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 if(process.env.STEP09_ENABLED!=="true")return errorJson("Die Tagesübersicht wird vorbereitet.",503);
 const result=await getStep09Today(user.id);
 return NextResponse.json({ok:true,...result},{headers:{"cache-control":"private, no-store"}});
}