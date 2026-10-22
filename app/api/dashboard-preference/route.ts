import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser} from "../../../lib/http";
import {dashboardEnabled,getDashboardPreference} from "../../../lib/women-dashboard";

const preferenceSchema=z.object({
 mode:z.enum(["GENERAL","WOMEN"]),
 presenterPreference:z.enum(["ANY","TRAINERIN"])
}).strict();

export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 return NextResponse.json({ok:true,preference:await getDashboardPreference(user.id)},
  {headers:{"cache-control":"private, no-store"}});
}
export async function POST(request:Request){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 if(!dashboardEnabled())return errorJson("Die Ansichtsoption ist noch nicht freigegeben.",503,"WOMEN_DASHBOARD_DISABLED");
 const input=preferenceSchema.safeParse(await request.json().catch(()=>null));
 if(!input.success)return errorJson("Bitte eine gültige Ansicht auswählen.",422);
 // The owner alone can write their preference. Neither sex nor consent is changed.
 const saved=await prisma.athleteDashboardPreference.upsert({
  where:{userId:user.id},
  create:{userId:user.id,mode:input.data.mode,presenterPreference:input.data.presenterPreference},
  update:{mode:input.data.mode,presenterPreference:input.data.presenterPreference}
 });
 return NextResponse.json({ok:true,preference:{enabled:true,mode:saved.mode,
  presenterPreference:saved.presenterPreference,source:"saved",cycleModuleEnabled:false}},
  {headers:{"cache-control":"private, no-store"}});
}
