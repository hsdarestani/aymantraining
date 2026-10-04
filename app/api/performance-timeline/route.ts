import {NextResponse} from "next/server";
import {prisma} from "../../../lib/db";
import {errorJson,requireApiUser} from "../../../lib/http";
import {hasFeature} from "../../../lib/entitlements";

export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(!await hasFeature(user.subscriptionTier,"performance_timeline"))return errorJson("Die Performance Timeline ist PRO.",403);
 const since=new Date(Date.now()-365*86400000);
 const [scores,tests,body]=await Promise.all([
  prisma.scoreSnapshot.findMany({where:{userId:user.id,date:{gte:since}},orderBy:{date:"asc"}}),
  prisma.performanceTest.findMany({where:{userId:user.id,completedAt:{not:null,gte:since}},include:{results:true},orderBy:{completedAt:"asc"}}),
  prisma.bodyMetric.findMany({where:{userId:user.id,date:{gte:since}},orderBy:{date:"asc"}})
 ]);
 return NextResponse.json({ok:true,scores,tests,body});
}
