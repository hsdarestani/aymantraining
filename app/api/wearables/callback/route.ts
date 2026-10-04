import crypto from "node:crypto";
import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
function sign(value:string){return crypto.createHmac("sha256",process.env.CRON_SECRET||"local").update(value).digest("hex")}
export async function GET(request:Request){
 const u=new URL(request.url),provider=(u.searchParams.get("provider")||"").toLowerCase(),externalUserId=u.searchParams.get("externalUserId")||"",encoded=u.searchParams.get("state")||"";
 try{
  const decoded=Buffer.from(encoded,"base64url").toString("utf8"),dot=decoded.lastIndexOf("."),raw=decoded.slice(0,dot),sig=decoded.slice(dot+1),[userId,exp]=raw.split(":");
  if(!userId||!exp||Number(exp)<Date.now()||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(sign(raw))))throw new Error("state");
  if(!provider||!externalUserId)throw new Error("provider");
  await prisma.wearableConnection.upsert({where:{userId_provider:{userId,provider}},update:{externalUserId,status:"CONNECTED",lastSyncAt:new Date()},create:{userId,provider,externalUserId,status:"CONNECTED"}});
  return NextResponse.redirect(new URL("/wearables?connected=1",process.env.APP_URL||"https://bedifferent.smarbiz.sbs"));
 }catch{return NextResponse.redirect(new URL("/wearables?error=1",process.env.APP_URL||"https://bedifferent.smarbiz.sbs"))}
}
