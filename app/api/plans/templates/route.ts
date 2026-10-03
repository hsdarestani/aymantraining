import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
import {errorJson,requireApiUser} from "../../../../lib/http";
export async function GET(){
  const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
  const items=await prisma.trainingPlan.findMany({where:{active:true,isTemplate:true,...(user.subscriptionTier==="FREE"?{proOnly:false}:{})},include:{items:{include:{exercise:true},orderBy:[{dayIndex:"asc"},{orderIndex:"asc"}]}},orderBy:{name:"asc"}});
  return NextResponse.json({ok:true,items});
}