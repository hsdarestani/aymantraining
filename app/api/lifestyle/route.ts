import {NextResponse} from "next/server";
import {prisma} from "../../../lib/db";
import {errorJson,requireApiUser} from "../../../lib/http";
import {hasFeature} from "../../../lib/entitlements";
export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const advanced=await hasFeature(user.subscriptionTier,"sleep_advanced");
 const since=new Date(Date.now()-30*86400000);
 const [wearables,checks,score]=await Promise.all([
  prisma.wearableDaily.findMany({where:{userId:user.id,date:{gte:since}},orderBy:{date:"desc"}}),
  prisma.dailyCheck.findMany({where:{userId:user.id,date:{gte:since}},orderBy:{date:"desc"}}),
  prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}})
 ]);
 return NextResponse.json({ok:true,advanced,wearables,checks,score});
}