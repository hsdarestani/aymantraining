import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";

const ACTIVE_EVENTS=new Set(["INITIAL_PURCHASE","RENEWAL","UNCANCELLATION","SUBSCRIPTION_EXTENDED","TEMPORARY_ENTITLEMENT_GRANT","NON_RENEWING_PURCHASE","REFUND_REVERSED"]);
const PASSIVE_EVENTS=new Set(["CANCELLATION","BILLING_ISSUE","SUBSCRIPTION_PAUSED","PRODUCT_CHANGE"]);
const EXPIRE_EVENTS=new Set(["EXPIRATION"]);

function tierFrom(event:any){
  const id=String(event?.new_product_id||event?.product_id||"").toLowerCase();
  return id.includes("elite")?"ELITE":"PRO";
}

async function hasOtherActive(userId:string){
  const now=new Date();
  return prisma.subscription.findFirst({where:{userId,status:"active",OR:[{renewsAt:null},{renewsAt:{gt:now}}]},orderBy:{updatedAt:"desc"}});
}

async function grantReferralReward(referredUserId:string){
  const ref=await prisma.referral.findFirst({where:{referredUserId,status:"USED",rewardGrantedAt:null}});
  if(!ref)return;
  const endsAt=new Date(Date.now()+30*86400000);
  await prisma.$transaction([
    prisma.referral.update({where:{id:ref.id},data:{status:"REWARDED",rewardGrantedAt:new Date()}}),
    prisma.subscription.create({data:{userId:ref.referrerUserId,tier:"PRO",provider:"internal_referral",status:"active",renewsAt:endsAt}}),
    prisma.user.update({where:{id:ref.referrerUserId},data:{subscriptionTier:"PRO"}})
  ]).catch(()=>undefined);
}

export async function POST(request:Request){
  const secret=process.env.REVENUECAT_WEBHOOK_SECRET;
  if(!secret)return NextResponse.json({ok:false,error:"RevenueCat webhook secret not configured"},{status:503});
  if(request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({ok:false},{status:401});

  const body=await request.json().catch(()=>null) as any;
  const event=body?.event;
  const userId=event?.app_user_id;
  const type=String(event?.type||"");
  if(!userId||!type)return NextResponse.json({ok:false},{status:422});

  if(type==="TEST")return NextResponse.json({ok:true,test:true});

  const user=await prisma.user.findUnique({where:{id:userId}});
  if(!user)return NextResponse.json({ok:true,ignored:"unknown_user"});

  const tier=tierFrom(event);
  const renewsAt=event?.expiration_at_ms?new Date(Number(event.expiration_at_ms)):undefined;
  const externalId=String(event?.id||event?.transaction_id||`${type}:${event?.event_timestamp_ms||Date.now()}`);

  const status=ACTIVE_EVENTS.has(type)?"active":EXPIRE_EVENTS.has(type)?"expired":PASSIVE_EVENTS.has(type)?type.toLowerCase():"event";
  await prisma.subscription.create({data:{userId,tier,provider:"revenuecat",externalId,status,renewsAt}}).catch(()=>undefined);

  if(ACTIVE_EVENTS.has(type)){
    await prisma.user.update({where:{id:userId},data:{subscriptionTier:tier}});
    if(type==="INITIAL_PURCHASE"||type==="RENEWAL")await grantReferralReward(userId);
  }

  if(EXPIRE_EVENTS.has(type)){
    const other=await hasOtherActive(userId);
    if(!other)await prisma.user.update({where:{id:userId},data:{subscriptionTier:"FREE"}});
  }

  // Cancellation and billing issues do not revoke access. RevenueCat sends EXPIRATION
  // when the paid/trial/grace period actually ends.
  return NextResponse.json({ok:true,type,status,tier,renewsAt});
}
