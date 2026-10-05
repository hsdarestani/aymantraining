import crypto from 'node:crypto';
import {normalizeTerraPayload} from './terra-contract';
export function terraConfigured(){return Boolean(process.env.TERRA_API_KEY&&process.env.TERRA_DEV_ID&&process.env.TERRA_SIGNING_SECRET)}
export async function terraRequest(action:'connect'|'sync'|'disconnect',payload:Record<string,unknown>){
 const headers={'x-api-key':process.env.TERRA_API_KEY!,'dev-id':process.env.TERRA_DEV_ID!,'content-type':'application/json'};
 const base='https://access.tryterra.co/api/v2';
 async function request(path:string,init:RequestInit={}){const r=await fetch(base+path,{...init,headers,signal:AbortSignal.timeout(15000),redirect:'error'});if(action==='disconnect'&&r.status===404)return {status:'success'};if(!r.ok)throw Error('Terra request failed');const result=await r.json();if(result.status==='error')throw Error('Terra provider error');return result}
 if(action==='connect'){
  const origin=new URL(String(payload.callbackUrl)).origin;
  const result=await request('/auth/generateWidgetSession',{method:'POST',body:JSON.stringify({providers:String(payload.provider).toUpperCase(),reference_id:payload.state,language:payload.locale==='en'?'en':'de',auth_success_redirect_url:origin+'/wearables?connected=1',auth_failure_redirect_url:origin+'/wearables?error=1'})});
  const url=new URL(result.url);if(url.protocol!=='https:'||url.hostname!=='widget.tryterra.co')throw Error('Invalid Terra authorization URL');return {connectUrl:url.toString()};
 }
 const user=String(payload.externalUserId??'');if(!user)throw Error('Missing Terra user');
 if(action==='disconnect'){await request('/auth/deauthenticateUser?'+new URLSearchParams({user_id:user}),{method:'DELETE'});return {ok:true}}
 const end=new Date(),start=new Date(payload.since?String(payload.since):Date.now()-7*86400000);if(!Number.isFinite(start.getTime()))throw Error('Invalid sync window');
 const query=new URLSearchParams({user_id:user,start_date:start.toISOString().slice(0,10),end_date:end.toISOString().slice(0,10),to_webhook:'false',with_samples:'false'});
 const results=await Promise.all(['daily','sleep','body','activity'].map(type=>request('/'+type+'?'+query).then(result=>({type,result})).catch(()=>({type,result:null}))));
 if(results.every(x=>x.result===null))throw Error('Terra sync failed');
 const days=new Map<string,any>();let pending=false;
 for(const {type,result} of results){if(!result)continue;if(!Array.isArray(result.data)){pending=true;continue}for(const item of normalizeTerraPayload({...result,type})){days.set(item.date,{...days.get(item.date),...item})}}
 const data=[...days.values()];return {eventId:crypto.randomUUID(),externalUserId:user,data,pending:pending||!data.length};
}
