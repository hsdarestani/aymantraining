import crypto from "node:crypto";
import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../../lib/db";
import {hashToken} from "../../../../../lib/auth";
import {errorJson} from "../../../../../lib/http";
const schema=z.object({code:z.string().regex(/^\d{6}$/)});
export async function POST(request:Request){
 const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return errorJson("Ungültiger Kopplungscode.",422);
 const codeHash=hashToken(p.data.code),now=new Date();
 const pair=await prisma.$transaction(async tx=>{
  const row=await tx.companionPairCode.findUnique({where:{codeHash}});
  if(!row)return null;
  const claimed=await tx.companionPairCode.updateMany({where:{id:row.id,claimedAt:null,expiresAt:{gt:now}},data:{claimedAt:now}});
  if(!claimed.count)return null;
  const token=crypto.randomBytes(32).toString("base64url"),expiresAt=new Date(now.getTime()+30*86400000);
  await tx.authSession.create({data:{userId:row.userId,tokenHash:hashToken(token),expiresAt}});
  return {token,expiresAt};
 });
 if(!pair)return errorJson("Kopplungscode ist ungültig oder abgelaufen.",404);
 return NextResponse.json({ok:true,sessionToken:pair.token,expiresAt:pair.expiresAt.toISOString()});
}
