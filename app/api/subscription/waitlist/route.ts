import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser} from "../../../../lib/http";
export async function POST(request:Request){
 if(!isSameOrigin(request)&&request.headers.get("x-bd-client")!=="mobile")return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const row=await prisma.systemSetting.findUnique({where:{key:"app_settings"}});
 const settings={proCapacity:50,waitlist:true,...((row?.value as any)||{})};
 if(!settings.waitlist)return errorJson("Warteliste ist aktuell nicht aktiv.",409);
 const active=await prisma.user.count({where:{role:"ATHLETE",subscriptionTier:{in:["PRO","ELITE"]}}});
 if(settings.proCapacity<=0||active<settings.proCapacity)return errorJson("PRO Plätze sind aktuell verfügbar.",409);
 const item=await prisma.waitlistEntry.upsert({where:{userId:user.id},update:{status:"WAITING"},create:{userId:user.id}});
 return NextResponse.json({ok:true,item:{status:item.status,joinedAt:item.joinedAt}});
}