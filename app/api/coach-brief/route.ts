import {NextResponse} from "next/server";
import {prisma} from "../../../lib/db";
import {errorJson,requireApiUser} from "../../../lib/http";
const rank:Record<string,number>={FREE:0,PRO:1,ELITE:2};
export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const now=new Date();
 const items=await prisma.coachBrief.findMany({where:{publishAt:{lte:now},OR:[{expiresAt:null},{expiresAt:{gt:now}}]},orderBy:{publishAt:"desc"},take:20});
 const item=items.find(x=>(rank[user.subscriptionTier]??0)>=(rank[x.audienceTier]??0))||null;
 return NextResponse.json({ok:true,item});
}
