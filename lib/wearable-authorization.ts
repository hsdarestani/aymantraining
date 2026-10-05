import crypto from 'node:crypto';
import {prisma} from './db';
export async function completeWearableAuthorization(provider:string,externalUserId:string,state:string){
 const tokenHash=crypto.createHash('sha256').update(state).digest('hex');
 return prisma.$transaction(async tx=>{
  // Serialise competing ownership claims for the same remote account.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${provider+':'+externalUserId}, 0))`;
  const attempt=await tx.wearableAuthAttempt.findUnique({where:{tokenHash}});
  if(!attempt||attempt.provider!==provider||attempt.expiresAt<=new Date())throw Error('expired_state');
  if(attempt.usedAt){const existing=await tx.wearableConnection.findUnique({where:{userId_provider:{userId:attempt.userId,provider}}});if(existing?.status==='CONNECTED'&&existing.externalUserId===externalUserId)return {duplicate:true};throw Error('replayed_state')}
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${attempt.userId} FOR UPDATE`;
  const consent=await tx.consentRecord.findFirst({where:{userId:attempt.userId,type:'health_data'},orderBy:{grantedAt:'desc'}});if(!consent?.granted)throw Error('no_consent');
  const claimed=await tx.wearableAuthAttempt.updateMany({where:{id:attempt.id,usedAt:null,expiresAt:{gt:new Date()}},data:{usedAt:new Date()}});if(claimed.count!==1)throw Error('replayed_state');
  const other=await tx.wearableConnection.findFirst({where:{provider,externalUserId,status:'CONNECTED',userId:{not:attempt.userId}}});if(other)throw Error('already_connected');
  await tx.wearableConnection.upsert({where:{userId_provider:{userId:attempt.userId,provider}},update:{externalUserId,status:'CONNECTED',connectedAt:new Date(),lastSyncAt:null,metadata:{revokePending:false}},create:{userId:attempt.userId,provider,externalUserId,status:'CONNECTED'}});
  return {duplicate:false};
 });
}
