import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser} from "../../../../lib/http";

function active(expiration?:string|null){
  if(!expiration)return true;
  const t=new Date(expiration).getTime();
  return Number.isFinite(t)&&t>Date.now();
}

export async function POST(request:Request){
  if(!isSameOrigin(request)&&request.headers.get("x-bd-client")!=="mobile")return errorJson("Ungültige Anfrage.",403);
  const user=await requireApiUser();
  if(!user)return errorJson("Nicht angemeldet.",401);

  const key=process.env.REVENUECAT_SECRET_API_KEY;
  if(!key)return NextResponse.json({ok:true,configured:false,tier:user.subscriptionTier});

  const response=await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user.id)}`,{
    headers:{"Authorization":`Bearer ${key}`,"X-Platform":"server"}
  });
  if(!response.ok)return errorJson("Subscription Sync fehlgeschlagen.",502);

  const payload:any=await response.json();
  const entitlements=payload?.subscriber?.entitlements||{};
  const proKey=process.env.REVENUECAT_PRO_ENTITLEMENT||"pro";
  const eliteKey=process.env.REVENUECAT_ELITE_ENTITLEMENT||"elite";

  let tier:"FREE"|"PRO"|"ELITE"="FREE";
  if(entitlements[eliteKey]&&active(entitlements[eliteKey].expires_date))tier="ELITE";
  else if(entitlements[proKey]&&active(entitlements[proKey].expires_date))tier="PRO";

  if(tier==="FREE"){
    const internal=await prisma.subscription.findFirst({
      where:{userId:user.id,status:"active",provider:{in:["internal_trial","internal_referral"]},OR:[{renewsAt:null},{renewsAt:{gt:new Date()}}]},
      orderBy:{updatedAt:"desc"}
    });
    if(internal)tier=internal.tier;
  }

  if(tier!==user.subscriptionTier)await prisma.user.update({where:{id:user.id},data:{subscriptionTier:tier}});
  return NextResponse.json({ok:true,configured:true,tier});
}
