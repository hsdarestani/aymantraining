import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
import {errorJson,requireApiUser} from "../../../../lib/http";
export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const row=await prisma.systemSetting.findUnique({where:{key:"app_settings"}});
 const settings={proCapacity:50,waitlist:true,proMonthly:39.99,proYearly:399,...((row?.value as any)||{})};
 const active=await prisma.user.count({where:{role:"ATHLETE",subscriptionTier:{in:["PRO","ELITE"]}}});
 const entry=await prisma.waitlistEntry.findUnique({where:{userId:user.id}});
 return NextResponse.json({ok:true,capacity:settings.proCapacity,active,available:settings.proCapacity<=0||active<settings.proCapacity,waitlist:Boolean(settings.waitlist),waitlistStatus:entry?.status||null,proMonthly:settings.proMonthly,proYearly:settings.proYearly});
}