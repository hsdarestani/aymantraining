import {NextResponse} from "next/server";
import {syncStorePurchase,verifyAppleSubscription,applyStoreVerification} from "../../../../lib/store-billing";
import {prisma} from "../../../../lib/db";

function decode<T=any>(jws:string):T|null{
  try{
    const payload=jws.split(".")[1];
    return payload?JSON.parse(Buffer.from(payload.replace(/-/g,"+").replace(/_/g,"/"),"base64").toString("utf8")) as T:null;
  }catch{return null}
}
export async function POST(request:Request){
  const body=await request.json().catch(()=>null) as any;
  const signedPayload=body?.signedPayload;
  if(typeof signedPayload!=="string")return NextResponse.json({ok:false},{status:422});
  const notification=decode<any>(signedPayload);
  const txJws=notification?.data?.signedTransactionInfo;
  const tx=typeof txJws==="string"?decode<any>(txJws):null;
  const lookup=String(tx?.originalTransactionId||tx?.transactionId||"");
  if(!lookup)return NextResponse.json({ok:true,ignored:"no_transaction"});
  try{
    const existing=await prisma.subscription.findFirst({where:{provider:"app_store",externalId:lookup}});
    if(existing){
      const synced=await syncStorePurchase("app_store",lookup);
      return NextResponse.json({ok:true,type:notification?.notificationType||null,tier:synced?.tier||null});
    }
    // For notifications arriving immediately after a client purchase, resolve the current
    // Apple status but do not attach it to an unknown BE DIFFERENT account.
    const verified=await verifyAppleSubscription(lookup);
    const linked=await prisma.subscription.findFirst({where:{provider:"app_store",externalId:verified.externalId}});
    if(linked){
      const tier=await applyStoreVerification(linked.userId,verified);
      return NextResponse.json({ok:true,type:notification?.notificationType||null,tier});
    }
    return NextResponse.json({ok:true,ignored:"unlinked_purchase"});
  }catch(error){
    console.error("Apple server notification sync failed",error);
    return NextResponse.json({ok:false},{status:502});
  }
}
