import {cert,getApps,initializeApp} from "firebase-admin/app";
import {getMessaging} from "firebase-admin/messaging";
import {prisma} from "./db";

function credentials(){
  if(process.env.FIREBASE_SERVICE_ACCOUNT_B64){
    try{
      const json=JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64,"base64").toString("utf8"));
      return {projectId:json.project_id,clientEmail:json.client_email,privateKey:json.private_key};
    }catch{return null}
  }
  if(process.env.FIREBASE_PROJECT_ID&&process.env.FIREBASE_CLIENT_EMAIL&&process.env.FIREBASE_PRIVATE_KEY){
    return {projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey:process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,"\n")};
  }
  return null;
}
function firebase(){
  const creds=credentials();
  if(!creds)return null;
  if(!getApps().length)initializeApp({credential:cert(creds)});
  return getMessaging();
}

export async function dispatchPendingPushes(limit=80){
  const messaging=firebase();
  const items=await prisma.notification.findMany({where:{sentAt:null,sendAt:{lte:new Date()}},orderBy:{sendAt:"asc"},take:limit});
  let sent=0,failed=0;
  if(!messaging)return {configured:false,sent,failed,pending:items.length};

  for(const item of items){
    const devices=await prisma.deviceToken.findMany({where:{userId:item.userId,active:true}});
    if(!devices.length){
      await prisma.notification.update({where:{id:item.id},data:{sentAt:new Date()}});
      continue;
    }
    const data=Object.fromEntries(Object.entries((item.data as Record<string,unknown>|null)||{}).map(([k,v])=>[k,String(v)]));
    const result=await messaging.sendEachForMulticast({
      tokens:devices.map(x=>x.token),
      notification:{title:item.title,body:item.body},
      data,
      android:{priority:"high",notification:{channelId:"bedifferent_default",sound:"default"}},
      apns:{headers:{"apns-priority":"10"},payload:{aps:{sound:"default",badge:0}}}
    }).catch(()=>null);

    if(result){
      sent+=result.successCount;
      failed+=result.failureCount;
      for(const [i,response] of result.responses.entries()){
        const code=String(response.error?.code||"");
        if(!response.success&&/registration-token-not-registered|invalid-registration-token|invalid-argument/.test(code)){
          await prisma.deviceToken.update({where:{id:devices[i].id},data:{active:false}}).catch(()=>undefined);
        }
      }
      await prisma.notification.update({where:{id:item.id},data:{sentAt:new Date()}});
    }else{
      failed+=devices.length;
    }
  }
  return {configured:true,sent,failed,pending:items.length};
}
