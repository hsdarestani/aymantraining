import crypto from "node:crypto";
import {NextResponse} from "next/server";
import {prisma} from "../../../../../lib/db";
import {errorJson,requireApiUser} from "../../../../../lib/http";
import {hashToken} from "../../../../../lib/auth";

export async function POST(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 await prisma.companionPairCode.deleteMany({where:{userId:user.id,OR:[{expiresAt:{lte:new Date()}},{claimedAt:{not:null}}]}});
 const code=String(crypto.randomInt(100000,999999));
 const expiresAt=new Date(Date.now()+10*60*1000);
 await prisma.companionPairCode.create({data:{userId:user.id,codeHash:hashToken(code),expiresAt}});
 return NextResponse.json({ok:true,code,expiresAt:expiresAt.toISOString()});
}
