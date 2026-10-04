import {AppStoreServerAPIClient,Environment,Status} from "@apple/app-store-server-library";
import {GoogleAuth} from "google-auth-library";
import {prisma} from "./db";

export const STORE_PRODUCTS={
  monthly:process.env.STORE_PRODUCT_PRO_MONTHLY||"bd_pro_monthly",
  yearly:process.env.STORE_PRODUCT_PRO_YEARLY||"bd_pro_yearly"
};
const allowedProducts=new Set(Object.values(STORE_PRODUCTS));

export type StoreVerification={
  provider:"app_store"|"google_play";
  externalId:string;
  productId:string;
  active:boolean;
  status:string;
  renewsAt:Date|null;
  environment?:string|null;
};

function decodeJwsPayload<T=any>(jws:string):T|null{
  try{
    const part=jws.split(".")[1];
    if(!part)return null;
    return JSON.parse(Buffer.from(part.replace(/-/g,"+").replace(/_/g,"/"),"base64").toString("utf8")) as T;
  }catch{return null}
}
function applePrivateKey(){
  if(!process.env.APPLE_IAP_PRIVATE_KEY_B64)return null;
  try{return Buffer.from(process.env.APPLE_IAP_PRIVATE_KEY_B64,"base64").toString("utf8")}catch{return null}
}
function appleClient(environment:Environment){
  const key=applePrivateKey();
  const keyId=process.env.APPLE_IAP_KEY_ID;
  const issuerId=process.env.APPLE_IAP_ISSUER_ID;
  if(!key||!keyId||!issuerId)return null;
  return new AppStoreServerAPIClient(key,keyId,issuerId,process.env.APPLE_BUNDLE_ID||"com.smarbiz.bedifferent",environment);
}

export async function verifyAppleSubscription(transactionId:string):Promise<StoreVerification>{
  if(!transactionId)throw new Error("Apple transaction id missing");
  let lastError:unknown;
  for(const environment of [Environment.PRODUCTION,Environment.SANDBOX]){
    const client=appleClient(environment);
    if(!client)throw new Error("Apple IAP credentials not configured");
    try{
      const response=await client.getAllSubscriptionStatuses(transactionId);
      if(response.bundleId&&response.bundleId!==(process.env.APPLE_BUNDLE_ID||"com.smarbiz.bedifferent"))throw new Error("Apple bundle mismatch");
      const candidates=(response.data||[]).flatMap(group=>group.lastTransactions||[]).map(item=>{
        const tx=item.signedTransactionInfo?decodeJwsPayload<any>(item.signedTransactionInfo):null;
        return {item,tx};
      }).filter(x=>x.tx&&allowedProducts.has(String(x.tx.productId||"")));
      if(!candidates.length)throw new Error("No BE DIFFERENT Apple subscription found");
      candidates.sort((a,b)=>Number(b.tx?.expiresDate||0)-Number(a.tx?.expiresDate||0));
      const best=candidates[0];
      const expiresMs=Number(best.tx.expiresDate||0);
      const renewsAt=expiresMs?new Date(expiresMs):null;
      const status=Number(best.item.status||0);
      const active=(status===Status.ACTIVE||status===Status.BILLING_GRACE_PERIOD)&&Boolean(renewsAt&&renewsAt.getTime()>Date.now())&&!best.tx.revocationDate;
      return {
        provider:"app_store",
        externalId:String(best.tx.originalTransactionId||best.item.originalTransactionId||best.tx.transactionId||transactionId),
        productId:String(best.tx.productId),
        active,
        status:active?"active":status===Status.REVOKED?"revoked":status===Status.BILLING_RETRY?"billing_retry":"expired",
        renewsAt,
        environment:String(response.environment||environment)
      };
    }catch(error){lastError=error}
  }
  throw lastError instanceof Error?lastError:new Error("Apple subscription verification failed");
}

function googleCredentials(){
  const value=process.env.GOOGLE_SERVICE_ACCOUNT_B64||process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_B64;
  if(!value)return null;
  try{return JSON.parse(Buffer.from(value,"base64").toString("utf8"))}catch{return null}
}

export async function verifyGoogleSubscription(purchaseToken:string):Promise<StoreVerification>{
  if(!purchaseToken)throw new Error("Google purchase token missing");
  const credentials=googleCredentials();
  if(!credentials)throw new Error("Google Play service account not configured");
  const packageName=process.env.GOOGLE_PLAY_PACKAGE_NAME||"com.smarbiz.bedifferent";
  const url=`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;
  const auth=new GoogleAuth({credentials,scopes:["https://www.googleapis.com/auth/androidpublisher"]});
  const client=await auth.getClient();
  const headers=await client.getRequestHeaders(url);
  const response=await fetch(url,{headers:Object.fromEntries(headers.entries()),cache:"no-store"});
  if(!response.ok)throw new Error(`Google Play verification failed (${response.status})`);
  const data:any=await response.json();
  const lines=Array.isArray(data.lineItems)?data.lineItems:[];
  const allowed=lines.filter((x:any)=>allowedProducts.has(String(x.productId||"")));
  if(!allowed.length)throw new Error("No BE DIFFERENT Google subscription found");
  allowed.sort((a:any,b:any)=>new Date(b.expiryTime||0).getTime()-new Date(a.expiryTime||0).getTime());
  const best=allowed[0];
  const renewsAt=best.expiryTime?new Date(best.expiryTime):null;
  const state=String(data.subscriptionState||"");
  const entitledStates=new Set(["SUBSCRIPTION_STATE_ACTIVE","SUBSCRIPTION_STATE_IN_GRACE_PERIOD","SUBSCRIPTION_STATE_CANCELED"]);
  const active=entitledStates.has(state)&&Boolean(renewsAt&&renewsAt.getTime()>Date.now());
  return {
    provider:"google_play",
    externalId:purchaseToken,
    productId:String(best.productId),
    active,
    status:active?(state==="SUBSCRIPTION_STATE_CANCELED"?"canceled":"active"):state.toLowerCase().replace("subscription_state_","")||"expired",
    renewsAt,
    environment:data.testPurchase?"sandbox":"production"
  };
}

async function rewardReferral(referredUserId:string){
  const ref=await prisma.referral.findFirst({where:{referredUserId,status:"USED",rewardGrantedAt:null}});
  if(!ref)return;
  const endsAt=new Date(Date.now()+30*86400000);
  await prisma.$transaction([
    prisma.referral.update({where:{id:ref.id},data:{status:"REWARDED",rewardGrantedAt:new Date()}}),
    prisma.subscription.create({data:{userId:ref.referrerUserId,tier:"PRO",provider:"internal_referral",status:"active",renewsAt:endsAt}}),
    prisma.user.update({where:{id:ref.referrerUserId},data:{subscriptionTier:"PRO"}})
  ]).catch(()=>undefined);
}

export async function recomputeUserEntitlement(userId:string){
  const now=new Date();
  const active=await prisma.subscription.findFirst({
    where:{userId,status:{in:["active","canceled"]},OR:[{renewsAt:null},{renewsAt:{gt:now}}]},
    orderBy:{updatedAt:"desc"}
  });
  const tier=active?.tier||"FREE";
  await prisma.user.update({where:{id:userId},data:{subscriptionTier:tier}});
  return tier;
}

export async function applyStoreVerification(userId:string,result:StoreVerification){
  const conflict=await prisma.subscription.findFirst({where:{provider:result.provider,externalId:result.externalId,userId:{not:userId}}});
  if(conflict)throw new Error("Store purchase is already linked to another BE DIFFERENT account");

  const previous=await prisma.subscription.findFirst({where:{provider:result.provider,externalId:result.externalId,userId}});
  if(previous){
    await prisma.subscription.update({where:{id:previous.id},data:{status:result.status,renewsAt:result.renewsAt,tier:"PRO"}});
  }else{
    await prisma.subscription.create({data:{userId,tier:"PRO",provider:result.provider,externalId:result.externalId,status:result.status,renewsAt:result.renewsAt}});
  }

  if(result.active){
    await prisma.user.update({where:{id:userId},data:{subscriptionTier:"PRO"}});
    if(!previous)await rewardReferral(userId);
    return "PRO" as const;
  }
  return recomputeUserEntitlement(userId);
}

export async function syncStorePurchase(provider:"app_store"|"google_play",externalId:string){
  const existing=await prisma.subscription.findFirst({where:{provider,externalId},orderBy:{updatedAt:"desc"}});
  if(!existing)return null;
  const result=provider==="app_store"?await verifyAppleSubscription(externalId):await verifyGoogleSubscription(externalId);
  const tier=await applyStoreVerification(existing.userId,result);
  return {userId:existing.userId,result,tier};
}
