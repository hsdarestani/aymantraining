export async function captureExternalAnalytics(userId:string|undefined,name:string,properties?:Record<string,unknown>){
  if(!process.env.POSTHOG_KEY) return {configured:false};
  const host=(process.env.POSTHOG_HOST||"https://eu.i.posthog.com").replace(/\/$/,"");
  await fetch(host+"/capture/",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({api_key:process.env.POSTHOG_KEY,event:name,properties:{distinct_id:userId||"anonymous",...properties}})}).catch(()=>undefined);
  return {configured:true};
}
