import {prisma} from "./db";
import {hasFeature} from "./entitlements";
import {wearableEventSchema,filterWearableData,completeness} from "./wearable-contract";
import {recomputeScoreForUser} from "./scoring";
import {evaluateRecommendations} from "./recommendations";
import type {z} from "zod";
export class WearableStateError extends Error{}
export async function importWearableEvent(provider:string,event:z.infer<typeof wearableEventSchema>){
  const result=await prisma.$transaction(async tx=>{
    const conn=await tx.wearableConnection.findFirst({where:{provider,externalUserId:event.externalUserId,status:"CONNECTED"},include:{user:true}});
    if(!conn)throw new WearableStateError("Wearable connection not found");
    await tx.$queryRaw`SELECT id FROM "WearableConnection" WHERE id = ${conn.id} FOR UPDATE`;
    const current=await tx.wearableConnection.findUnique({where:{id:conn.id}});
    if(current?.status!=="CONNECTED")throw new WearableStateError("Wearable disconnected");
    const consent=await tx.consentRecord.findFirst({where:{userId:conn.userId,type:"health_data"},orderBy:{grantedAt:"desc"}});if(!consent?.granted)throw new WearableStateError("Health consent withdrawn");
    const eventKey="wearable_event:"+provider+":"+event.eventId;
    if(await tx.systemSetting.findUnique({where:{key:eventKey}}))return {userId:conn.userId,duplicate:true};
    const advanced=await hasFeature(conn.user.subscriptionTier,"wearable_advanced");
    for(const item of event.data){
      const date=new Date(item.date+"T00:00:00Z"),data=filterWearableData(item,advanced);
      const previous=await tx.wearableDaily.findUnique({where:{userId_date_source:{userId:conn.userId,date,source:provider}}});
      data.completeness=completeness({...previous,...data});
      await tx.wearableDaily.upsert({where:{userId_date_source:{userId:conn.userId,date,source:provider}},update:data,create:{userId:conn.userId,date,source:provider,...data}});
    }
    await tx.wearableConnection.update({where:{id:conn.id},data:{lastSyncAt:new Date(),metadata:{lastError:null}}});
    await tx.systemSetting.create({data:{key:eventKey,value:{receivedAt:new Date().toISOString()}}});
    return {userId:conn.userId,duplicate:false};
  });
  if(!result.duplicate)await Promise.all([recomputeScoreForUser(result.userId),evaluateRecommendations(result.userId)]);
  return {duplicate:result.duplicate};
}
