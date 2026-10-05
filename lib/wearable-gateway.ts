import {terraConfigured,terraRequest} from "./terra";
import {signature} from "./wearable-contract";
export class WearableGatewayError extends Error{}
export function wearableGateway(){
  if(terraConfigured())return {base:"https://access.tryterra.co/api/v2",secret:process.env.TERRA_SIGNING_SECRET!,terra:true};
  const raw=process.env.WEARABLE_AGGREGATOR_URL||"",secret=process.env.WEARABLE_AGGREGATOR_SECRET||"";
  if(!raw||secret.length<32)return null;
  const url=new URL(raw);
  if(url.username||url.password||url.search||url.hash||!(url.protocol==="https:"||(url.protocol==="http:"&&["localhost","127.0.0.1","::1","[::1]"].includes(url.hostname))))throw new WearableGatewayError("Invalid wearable gateway configuration");
  return {base:url.toString().replace(/\/$/,""),secret,terra:false};
}
export async function gatewayRequest(action:"connect"|"sync"|"disconnect",payload:Record<string,unknown>){
  const config=wearableGateway();if(!config)throw new WearableGatewayError("Wearable provider is not configured");
  if(config.terra)return terraRequest(action,payload);
  const body=JSON.stringify(payload),timestamp=String(Date.now());
  const response=await fetch(config.base+"/"+action,{method:"POST",headers:{"content-type":"application/json","x-bd-timestamp":timestamp,"x-bd-signature":signature(body,config.secret,timestamp)},body,signal:AbortSignal.timeout(15000),redirect:"error"});
  if(!response.ok)throw new WearableGatewayError("Wearable provider request failed");
  const result=await response.json();
  if(action==="connect"){
    if(typeof result.connectUrl!=="string")throw new WearableGatewayError("Invalid provider response");
    const url=new URL(result.connectUrl);
    if(url.username||url.password||!(url.protocol==="https:"||(url.protocol==="http:"&&url.origin===new URL(config.base).origin)))throw new WearableGatewayError("Invalid authorization URL");
  }
  return result;
}
