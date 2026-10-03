import {cert,getApps,initializeApp} from "firebase-admin/app";
import {getMessaging} from "firebase-admin/messaging";
import {prisma} from "./db";
import {integrationStatus} from "./integrations";

function credentials(){
  if(process.env.FIREBASE_SERVICE_ACCOUNT_B64){
    try{
      const raw=Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64,"base64").toString("utf8");
      const json=JSON.parse(raw);
      return {projectId:json.project_id,clientEmail:json.client_email,privateKey:json.private_key};
    }catch{return null;}
  }
  if(process.env.FIREBASE_PROJECT_ID&&process.env.FIREBASE_CLIENT_EMAIL&&process.env.FIREBASE_PRIVATE_KEY){
    return {projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey:process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,"\n")};
  }
  return null;
}

function firebase(){
  if(!integrationStatus().firebase) return null;
  const creds=credentials();if(!creds)return null;
  if(!getApps().length)initializeApp({credential:cert(creds)});
  return getMessaging();
}

export async function dispatchPendingPushes(limit=80){
  const messaging=firebase();if(!messaging)return {configured:false,sent:0,failed:0};
  const items=await prisma.notification.findMany({where:{sentAt:null,sendAt:{lte:new Date()}},orderBy:{sendAt:"asc"},take:limit});
  let sent=0,failed=0;
  for(const item of items){
    const tokens=await prisma.deviceToken.findMany({where:{userId:item.userId,active:true}});
    if(!tokens.length){await prisma.notification.update({where:{id:item.id},data:{sentAt:new Date()}});continue;}
    const result=await messaging.sendEachForMulticast({
      tokens:tokens.map(t=>t.token),
      notification:{title:item.title,body:item.body},
      data:Object.fromEntries(Object.entries((item.data as Record<string,unknown>|null)||{}).map(([k,v])=>[k,String(v)]))
    }).catch(()=>null);
    if(!result){failed++;continue;}
    sent+=result.successCount;failed+=result.failureCount;
    for(const [i,response] of result.responses.entries()){
      if(!response.success&&/registration-token-not-registered|invalid-registration-token/.test(String(response.error?.code||""))){
        await prisma.deviceToken.update({where:{id:tokens[i].id},data:{active:false}}).catch(()=>undefined);
      }
    }
    await prisma.notification.update({where:{id:item.id},data:{sentAt:new Date()}});
  }
  return {configured:true,sent,failed};
}
