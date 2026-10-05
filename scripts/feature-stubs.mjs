// Isolated CI provider simulation. Never used by production.
import http from 'node:http';import crypto from 'node:crypto';
const secret=process.env.WEARABLE_AGGREGATOR_SECRET;const state={failRevoke:false,failSync:false,invalidData:false,aiFailure:false,aiUnsafe:false,calls:[]};
http.createServer(async(req,res)=>{let raw='';for await(const x of req)raw+=x;const body=raw?JSON.parse(raw):{};res.setHeader('content-type','application/json');const send=(code,value)=>{res.writeHead(code);res.end(JSON.stringify(value))};
 if(req.url==='/control'){Object.assign(state,body);return send(200,{ok:true})}if(req.url==='/inspect')return send(200,state);
 if(req.url==='/responses'){state.calls.push({action:'ai',body});if(state.aiFailure)return send(503,{error:'unavailable'});return send(200,{output:[{content:[{type:'output_text',text:state.aiUnsafe?'Your plan has been updated.':'Keep training consistent. Your coach decides any plan changes.'}]}]})}
 const stamp=req.headers['x-bd-timestamp'],expected=crypto.createHmac('sha256',secret).update(stamp+'.'+raw).digest('hex');if(req.headers['x-bd-signature']!==expected)return send(401,{error:'signature'});state.calls.push({action:req.url,body});
 if(req.url==='/connect')return send(200,{connectUrl:'http://127.0.0.1:3001/authorize?state='+encodeURIComponent(body.state)+'&provider='+body.provider});
 if(req.url==='/disconnect')return send(state.failRevoke?503:200,{ok:!state.failRevoke});
 if(req.url==='/sync'){if(state.failSync)return send(503,{error:'temporary'});return send(200,{eventId:crypto.randomUUID(),data:[{date:new Date().toISOString().slice(0,10),steps:state.invalidData?-1:9500,hrv:70,sleepMinutes:480,weightKg:80}]})}
 send(404,{error:'not found'});
}).listen(3001,'127.0.0.1',()=>console.log('FEATURE_STUBS_READY'));
