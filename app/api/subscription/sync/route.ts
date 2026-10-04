import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser} from "../../../../lib/http";
import {recomputeUserEntitlement,syncStorePurchase} from "../../../../lib/store-billing";

export async function POST(request:Request){
  if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
  const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
  const rows=await prisma.subscription.findMany({
    where:{userId:user.id,provider:{in:["app_store","google_play"]}},
    orderBy:{updatedAt:"desc"},
    take:8
  });
  let checked=0;
  for(const row of rows){
    if(!row.externalId)continue;
    try{
      await syncStorePurchase(row.provider as "app_store"|"google_play",row.externalId);
      checked++;
    }catch(error){console.error("Subscription refresh failed",row.provider,error)}
  }
  const tier=await recomputeUserEntitlement(user.id);
  return NextResponse.json({ok:true,configured:true,tier,checked});
}
