import crypto from "node:crypto";
import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
import {errorJson,requireApiUser} from "../../../../lib/http";
const providers=["garmin","polar","suunto","coros","whoop","oura","fitbit"];
function sign(value:string){return crypto.createHmac("sha256",process.env.CRON_SECRET||"local").update(value).digest("hex")}
export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const items=await prisma.wearableConnection.findMany({where:{userId:user.id},orderBy:{connectedAt:"desc"}});
 const base=process.env.WEARABLE_AGGREGATOR_CONNECT_URL||"";
 const stateRaw=`${user.id}:${Date.now()+15*60*1000}`,state=Buffer.from(stateRaw+"."+sign(stateRaw)).toString("base64url");
 return NextResponse.json({ok:true,items,providers:providers.map(provider=>({provider,configured:Boolean(base),connectUrl:base?`${base}${base.includes("?")?"&":"?"}provider=${encodeURIComponent(provider)}&state=${encodeURIComponent(state)}`:null}))});
}
