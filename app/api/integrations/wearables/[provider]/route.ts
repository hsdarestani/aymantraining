import {NextResponse} from "next/server";
import {providerSchema,wearableEventSchema,verifySignature} from "../../../../../lib/wearable-contract";
import {wearableGateway} from "../../../../../lib/wearable-gateway";
import {importWearableEvent,WearableStateError} from "../../../../../lib/wearable-service";
export async function POST(request:Request,{params}:{params:Promise<{provider:string}>}){
 const {provider}=await params;if(!providerSchema.safeParse(provider).success)return NextResponse.json({ok:false,error:"invalid_provider"},{status:404});
 let config;try{config=wearableGateway()}catch{}if(!config)return NextResponse.json({ok:false,error:"not_configured"},{status:503});
 const raw=await request.text();if(raw.length>200000)return NextResponse.json({ok:false,error:"payload_too_large"},{status:413});
 if(!verifySignature(raw,config.secret,request.headers.get("x-bd-timestamp"),request.headers.get("x-bd-signature")))return NextResponse.json({ok:false,error:"unauthorized"},{status:401});
 let body;try{body=JSON.parse(raw)}catch{return NextResponse.json({ok:false,error:"invalid_json"},{status:422})}
 const p=wearableEventSchema.safeParse(body);if(!p.success)return NextResponse.json({ok:false,error:"invalid_data"},{status:422});
 try{const result=await importWearableEvent(provider,p.data);return NextResponse.json({ok:true,...result})}
 catch(e){if(e instanceof WearableStateError)return NextResponse.json({ok:false,error:"connection_not_found"},{status:409});throw e;}
}
