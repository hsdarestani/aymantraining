import {cert,getApps,initializeApp} from "firebase-admin/app";
import {getMessaging} from "firebase-admin/messaging";
import {prisma} from "./db";
import {integrationStatus} from "./integrations";

function credentials(){
  if(process.env.FIREBASE_SERVICE_ACCOUNT_B64){
    try{const json=JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64,"base64").toString("utf8"));return {projectId:json.project_id,clientEmail:json.client_email,privateKey:json.private_key}}catch{return null}
  }
  if(process.env.FIREBASE_PROJECT_ID&&process.env.FIREBASE_CLIENT_EMAIL&&process.env.FIREBASE_PRIVATE_KEY)return {projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey:process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,"\n")};
  return null;
}
function firebase(){
  if(!integrationStatus().firebase)return null;
  const creds=credentials();if(!creds)return null;
  if(!getApps().length)initializeApp({credential:cert(creds)});
  return getMessaging();
}
const isExpo=(t:string)=>/^(ExponentPushToken|ExpoPushToken)\[/.test(t);

async function sendExpo(tokens:string[],title:string,body:string,data:Record<string,string>){
  if(!tokens.length)return {sent:0,failed:0};
  const messages=tokens.map(to=>({to,title,body,data,sound:"default",priority:"high"}));
  const headers:Record<string,string>={"content-type":"application/json","accept":"application/json","accept-encoding":"gzip, deflate"};
  if(process.env.EXPO_PUSH_ACCESS_TOKEN)headers.authorization=`Bearer ${process.env.EXPO_PUSH_ACCESS_TOKEN}`;
  const r=await fetch("https://exp.host/--/api/v2/push/send",{method:"POST",headers,body:JSON.stringify(messages)});
  if(!r.ok)return {sent:0,failed:tokens.length};
  const j:any=await r.json().catch(()=>({}));
  const tickets=Array.isArray(j.data)?j.data:[j.data].filter(Boolean);
  return {sent:tickets.filter((x:any)=>x?.status==="ok").length,failed:tickets.filter((x:any)=>x?.status!=="ok").length};
}

export async function dispatchPendingPushes(limit=80){
  const messaging=firebase();
  const items=await prisma.notification.findMany({where:{sentAt:null,sendAt:{lte:new Date()}},orderBy:{sendAt:"asc"},take:limit});
  let sent=0,failed=0;
  for(const item of items){
    const devices=await prisma.deviceToken.findMany({where:{userId:item.userId,active:true}});
    if(!devices.length){await prisma.notification.update({where:{id:item.id},data:{sentAt:new Date()}});continue}
    const data=Object.fromEntries(Object.entries((item.data as Record<string,unknown>|null)||{}).map(([k,v])=>[k,String(v)]));
    const expo=devices.filter(d=>isExpo(d.token));
    const direct=devices.filter(d=>!isExpo(d.token));

    if(expo.length){const result=await sendExpo(expo.map(x=>x.token),item.title,item.body,data);sent+=result.sent;failed+=result.failed}
    if(direct.length&&messaging){
      const result=await messaging.sendEachForMulticast({tokens:direct.map(x=>x.token),notification:{title:item.title,body:item.body},data}).catch(()=>null);
      if(result){sent+=result.successCount;failed+=result.failureCount;for(const [i,response] of result.responses.entries())if(!response.success&&/registration-token-not-registered|invalid-registration-token/.test(String(response.error?.code||"")))await prisma.deviceToken.update({where:{id:direct[i].id},data:{active:false}}).catch(()=>undefined)}
      else failed+=direct.length;
    }else if(direct.length)failed+=direct.length;

    await prisma.notification.update({where:{id:item.id},data:{sentAt:new Date()}});
  }
  return {configured:Boolean(process.env.EXPO_PUSH_ACCESS_TOKEN)||Boolean(messaging)||items.length===0,sent,failed};
}
