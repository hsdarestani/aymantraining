import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser} from "../../../../lib/http";

const schema=z.object({platform:z.enum(["ios","android"])});

function active(expiration?:string|null){
  if(!expiration)return true;
  const t=new Date(expiration).getTime();
  return Number.isFinite(t)&&t>Date.now();
}

export async function POST(request:Request){
  if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
  const user=await requireApiUser();
  if(!user)return errorJson("Nicht angemeldet.",401);

  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return errorJson("Plattform fehlt.",422);

  const key=parsed.data.platform==="ios"
    ?process.env.REVENUECAT_IOS_PUBLIC_API_KEY
    :process.env.REVENUECAT_ANDROID_PUBLIC_API_KEY;

  if(!key)return NextResponse.json({ok:true,configured:false,tier:user.subscriptionTier});

  const response=await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user.id)}`,{
    headers:{
      "Authorization":`Bearer ${key}`,
      "X-Platform":parsed.data.platform
    },
    cache:"no-store"
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
