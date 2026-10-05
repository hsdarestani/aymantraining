import {completeWearableAuthorization} from "../../../../lib/wearable-authorization";
import {NextResponse} from "next/server";
import {providerSchema,verifySignature} from "../../../../lib/wearable-contract";
import {wearableGateway} from "../../../../lib/wearable-gateway";
export async function GET(request:Request){
 const u=new URL(request.url),provider=u.searchParams.get("provider")||"",externalUserId=u.searchParams.get("externalUserId")||"",state=u.searchParams.get("state")||"";
 const base=process.env.APP_URL||"https://bedifferent.smarbiz.sbs";
 try{
  const config=wearableGateway();
  const payload=JSON.stringify({provider,externalUserId,state});
  if(!config||!providerSchema.safeParse(provider).success||externalUserId.length<1||externalUserId.length>200||state.length>100||!verifySignature(payload,config.secret,u.searchParams.get("timestamp"),u.searchParams.get("signature")))throw Error("invalid_callback");
  const result=await completeWearableAuthorization(provider,externalUserId,state);if(result.duplicate)throw Error("replayed_state");
  return NextResponse.redirect(new URL("/wearables?connected=1",base));
 }catch{return NextResponse.redirect(new URL("/wearables?error=1",base))}
}
