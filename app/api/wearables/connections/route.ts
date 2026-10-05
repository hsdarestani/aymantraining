import crypto from "node:crypto";
import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
import {errorJson,requireApiUser,isSameOrigin} from "../../../../lib/http";
import {providerSchema,wearableProviders,wearableEventSchema} from "../../../../lib/wearable-contract";
import {wearableGateway,gatewayRequest} from "../../../../lib/wearable-gateway";
import {importWearableEvent} from "../../../../lib/wearable-service";
import {z} from "zod";
const schema=z.object({provider:providerSchema,action:z.enum(["connect","sync","disconnect"])});
export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const items=await prisma.wearableConnection.findMany({where:{userId:user.id},orderBy:{connectedAt:"desc"},select:{provider:true,status:true,connectedAt:true,lastSyncAt:true}});
 let configured=false;try{configured=Boolean(wearableGateway())}catch{}
 return NextResponse.json({ok:true,items,providers:wearableProviders.map(provider=>({provider,configured}))});
}
export async function POST(request:Request){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return errorJson("Ungültige Verbindung.",422);
 const {provider,action}=p.data;
 const conn=await prisma.wearableConnection.findUnique({where:{userId_provider:{userId:user.id,provider}}});
 if(action==="disconnect"){
  if(!conn)return errorJson("Verbindung nicht gefunden.",404);
  // Disable imports before contacting the provider. A failed remote revoke is retryable.
  await prisma.$transaction(async tx=>{await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;await tx.wearableConnection.update({where:{id:conn.id},data:{status:"DISCONNECTED"}});await tx.wearableAuthAttempt.updateMany({where:{userId:user.id,provider,usedAt:null},data:{usedAt:new Date()}});});
  try{await gatewayRequest("disconnect",{provider,externalUserId:conn.externalUserId});await prisma.wearableConnection.update({where:{id:conn.id},data:{metadata:{revokePending:false},externalUserId:null}});return NextResponse.json({ok:true,revokePending:false});}
  catch{await prisma.wearableConnection.update({where:{id:conn.id},data:{metadata:{revokePending:true}}});return NextResponse.json({ok:true,revokePending:true});}
 }
 const consent=await prisma.consentRecord.findFirst({where:{userId:user.id,type:"health_data"},orderBy:{grantedAt:"desc"}});
 if(!consent?.granted)return errorJson("Gesundheitsdaten benötigen deine Einwilligung.",403);
 if(action==="sync"){
  if(conn?.status!=="CONNECTED"||!conn.externalUserId)return errorJson("Verbindung ist nicht aktiv.",409);
  if(conn.lastSyncAt&&Date.now()-conn.lastSyncAt.getTime()<30000)return errorJson("Bitte warte kurz vor der nächsten Synchronisierung.",429);
  try{
   const result=await gatewayRequest("sync",{provider,externalUserId:conn.externalUserId,since:conn.lastSyncAt?.toISOString()??null});
   if(result.pending&&!result.data?.length)return NextResponse.json({ok:true,pending:true});
   const event=wearableEventSchema.safeParse({...result,externalUserId:conn.externalUserId});if(!event.success)return errorJson("Ungültige Anbieterdaten.",502);
   const imported=await importWearableEvent(provider,event.data);return NextResponse.json({ok:true,...imported});
  }catch{return errorJson("Synchronisierung fehlgeschlagen. Bitte erneut versuchen.",502)}
 }
 if(conn?.status==="CONNECTED")return errorJson("Anbieter ist bereits verbunden.",409);
 // An unresolved remote revoke must be retried before creating a new connection.
 if((conn?.metadata as any)?.revokePending)return errorJson("Bitte die ausstehende Trennung zuerst erneut versuchen.",409);
 try{
  if(!wearableGateway())return errorJson("Anbieter ist noch nicht aktiviert.",503);
  const token=crypto.randomBytes(32).toString("base64url"),tokenHash=crypto.createHash("sha256").update(token).digest("hex");
  const attempt=await prisma.$transaction(async tx=>{await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;await tx.wearableAuthAttempt.updateMany({where:{userId:user.id,provider,usedAt:null},data:{usedAt:new Date()}});return tx.wearableAuthAttempt.create({data:{tokenHash,userId:user.id,provider,expiresAt:new Date(Date.now()+15*60000)}})});
  try{
   const result=await gatewayRequest("connect",{provider,state:token,locale:user.locale,callbackUrl:(process.env.APP_URL||"https://bedifferent.smarbiz.sbs")+"/api/wearables/callback"});
   return NextResponse.json({ok:true,connectUrl:result.connectUrl});
  }catch(e){await prisma.wearableAuthAttempt.update({where:{id:attempt.id},data:{usedAt:new Date()}});throw e;}
 }catch{return errorJson("Verbindung konnte nicht gestartet werden.",502)}
}
