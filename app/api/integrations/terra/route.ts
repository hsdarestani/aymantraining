import {NextResponse} from 'next/server';
import {verifyTerraSignature,terraProvider,normalizeTerraPayload,terraEventId} from '../../../../lib/terra-contract';
import {completeWearableAuthorization} from '../../../../lib/wearable-authorization';
import {importWearableEvent,WearableStateError} from '../../../../lib/wearable-service';
import {prisma} from '../../../../lib/db';
export async function POST(request:Request){
 const secret=process.env.TERRA_SIGNING_SECRET;if(!secret)return NextResponse.json({ok:false},{status:503});
 const raw=await request.text();if(raw.length>1000000)return NextResponse.json({ok:false},{status:413});
 if(!verifyTerraSignature(raw,secret,request.headers.get('terra-signature')))return NextResponse.json({ok:false},{status:401});
 let body;try{body=JSON.parse(raw)}catch{return NextResponse.json({ok:false},{status:422})}
 if(body?.type==='healthcheck')return NextResponse.json({ok:true});
 let provider,externalUserId;try{provider=terraProvider(body?.user?.provider);externalUserId=body?.user?.user_id;if(typeof externalUserId!=='string'||!externalUserId||externalUserId.length>200)throw Error()}catch{return NextResponse.json({ok:false},{status:422})}
 try{
  if(body.type==='auth'){
   if(body.status!=='success')return NextResponse.json({ok:true});
   const state=body.reference_id??body.user.reference_id;if(typeof state!=='string'||state.length>100)return NextResponse.json({ok:false},{status:422});
   await completeWearableAuthorization(provider,externalUserId,state);return NextResponse.json({ok:true});
  }
  if(['deauth','access_revoked','connection_error'].includes(body.type)){
   await prisma.wearableConnection.updateMany({where:{provider,externalUserId},data:{status:'DISCONNECTED',metadata:{revokePending:body.type==='connection_error'},...(body.type==='connection_error'?{}:{externalUserId:null})}});return NextResponse.json({ok:true});
  }
  if(!['daily','sleep','body','activity'].includes(body.type))return NextResponse.json({ok:true,ignored:true});
  let data;try{data=normalizeTerraPayload(body)}catch{return NextResponse.json({ok:false},{status:422})}
  if(!data.length)return NextResponse.json({ok:true,empty:true});
  const result=await importWearableEvent(provider,{eventId:terraEventId(raw),externalUserId,data});return NextResponse.json({ok:true,...result});
 }catch(e){if(e instanceof WearableStateError)return NextResponse.json({ok:true,ignored:true});if(body.type==='auth')return NextResponse.json({ok:false,error:'invalid_authorization'},{status:409});throw e;}
}
