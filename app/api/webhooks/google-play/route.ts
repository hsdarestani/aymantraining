import {NextResponse} from "next/server";
import {syncStorePurchase} from "../../../../lib/store-billing";

export async function POST(request:Request){
  const configured=process.env.GOOGLE_RTDN_WEBHOOK_SECRET;
  if(!configured)return NextResponse.json({ok:false,error:"Google RTDN webhook not configured"},{status:503});
  const url=new URL(request.url);
  if(url.searchParams.get("token")!==configured)return NextResponse.json({ok:false},{status:401});
  const body=await request.json().catch(()=>null) as any;
  const encoded=body?.message?.data;
  if(typeof encoded!=="string")return NextResponse.json({ok:false},{status:422});
  let event:any;
  try{event=JSON.parse(Buffer.from(encoded,"base64").toString("utf8"))}catch{return NextResponse.json({ok:false},{status:422})}
  const packageName=String(event?.packageName||"");
  if(packageName&&(process.env.GOOGLE_PLAY_PACKAGE_NAME||"com.smarbiz.bedifferent")!==packageName)return NextResponse.json({ok:true,ignored:"package"});
  const token=String(event?.subscriptionNotification?.purchaseToken||"");
  if(!token)return NextResponse.json({ok:true,ignored:"not_subscription"});
  try{
    const synced=await syncStorePurchase("google_play",token);
    return NextResponse.json({ok:true,notificationType:event?.subscriptionNotification?.notificationType||null,tier:synced?.tier||null});
  }catch(error){
    console.error("Google RTDN sync failed",error);
    return NextResponse.json({ok:false},{status:502});
  }
}
