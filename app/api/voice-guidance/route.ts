import {randomUUID} from "node:crypto";
import {NextResponse} from "next/server";
import {prisma} from "../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser} from "../../../lib/http";
import {deletePrivateObject,getPrivateObject,InvalidMediaRange,putPrivateObject} from "../../../lib/storage";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const prefix="voice_guidance:";
const categories=["WARM_UP","MOTIVATION","COOL_DOWN"] as const;
const audiences=["GENERAL","MALE","FEMALE"] as const;
type Item={id:string;title:string;category:string;audience:string;locale:string;active:boolean;mime:string;size:number;originalName:string;storageKey:string};
const key=(id:string)=>prefix+id;
const validId=(id:string)=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id);
const isManager=(role:string)=>role==="ADMIN";
const isAudience=(item:Item,sex:string|null)=>item.audience==="GENERAL"||(item.audience==="MALE"&&["male","m","mann","männlich"].includes((sex||"").toLowerCase()))||(item.audience==="FEMALE"&&["female","f","frau","weiblich","w"].includes((sex||"").toLowerCase()));
const view=({storageKey,...item}:Item)=>({...item,url:"/api/voice-guidance?id="+item.id});
function parseMetadata(form:FormData){
 const title=String(form.get("title")||"").trim(),category=String(form.get("category")||""),audience=String(form.get("audience")||""),locale=String(form.get("locale")||"");
 if(!title||title.length>120||!categories.some(v=>v===category)||!audiences.some(v=>v===audience)||!["de","en"].includes(locale))return null;
 return {title,category,audience,locale,active:form.get("active")==="true"};
}
function detectMime(data:Buffer){
 if(data.length<12)return null;
 if(data.subarray(4,8).toString()==="ftyp"){
  // Require an audio track and reject video tracks in ISO BMFF containers.
  const tracks:string[]=[];
  function scan(start:number,end:number,depth:number){
   if(depth>5)return;
   for(let pos=start;pos+8<=end;){
    let size=data.readUInt32BE(pos),offset=8;const type=data.toString("ascii",pos+4,pos+8);
    if(size===1){if(pos+16>end)return;const wide=data.readBigUInt64BE(pos+8);if(wide>BigInt(end-pos))return;size=Number(wide);offset=16;}else if(size===0)size=end-pos;
    if(size<offset||pos+size>end)return;
    if(["moov","trak","mdia"].includes(type))scan(pos+offset,pos+size,depth+1);
    if(type==="hdlr"&&size>=offset+12)tracks.push(data.toString("ascii",pos+offset+8,pos+offset+12));
    pos+=size;
   }
  }
  scan(0,data.length,0);return tracks.includes("soun")&&!tracks.includes("vide")?"audio/mp4":null;
 }
 if(data.subarray(0,3).toString()==="ID3"||(data[0]===255&&(data[1]&224)===224))return "audio/mpeg";
 return null;
}
export async function GET(request:Request){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const params=new URL(request.url).searchParams;
 const id=params.get("id");
 const playback=params.get("playback")==="1";
 const canManage=isManager(user.role);
 if(id){
  if(!validId(id))return errorJson("Nicht gefunden.",404);
  const row=await prisma.systemSetting.findUnique({where:{key:key(id)}});
  if(!row)return errorJson("Nicht gefunden.",404);
  const item=row.value as unknown as Item;
  if(!canManage&&(!item.active||!isAudience(item,user.sex)))return errorJson("Nicht gefunden.",404);
  try{
   const object=await getPrivateObject(item.storageKey,request.headers.get("range"));
   const headers:Record<string,string>={"content-type":item.mime,"accept-ranges":"bytes","cache-control":"private, no-store","vary":"Cookie, Authorization","x-content-type-options":"nosniff","content-length":String(object.size)};
   if(object.contentRange)headers["content-range"]=object.contentRange;
   return new Response(object.body,{status:object.contentRange?206:200,headers});
  }catch(e){if(e instanceof InvalidMediaRange)return new Response(null,{status:416,headers:{"content-range":"bytes */"+e.size}});return errorJson("Datei nicht verfügbar.",404);}
 }
 const rows=await prisma.systemSetting.findMany({where:{key:{startsWith:prefix}},orderBy:{updatedAt:"desc"}});
 const locale=params.get("locale")==="en"?"en":"de";
 const items=rows.map(r=>r.value as unknown as Item).filter(item=>playback?(item.active&&isAudience(item,user.sex)&&item.locale===locale):canManage||(item.active&&isAudience(item,user.sex)));
 if(playback)items.sort((a,b)=>Number(a.audience==="GENERAL")-Number(b.audience==="GENERAL"));
 return NextResponse.json({ok:true,items:items.map(view)},{headers:{"cache-control":"private, no-store"}});
}
export async function POST(request:Request){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);if(!isManager(user.role))return errorJson("Keine Berechtigung.",403);
 const form=await request.formData(),metadata=parseMetadata(form),file=form.get("file");
 if(!metadata||!(file instanceof File)||file.size<=0||file.size>25*1024*1024)return errorJson("Ungültige Angaben oder Datei (max. 25 MB).",422);
 const bytes=Buffer.from(await file.arrayBuffer()),mime=detectMime(bytes);
 if(!mime)return errorJson("Nur MP3, M4A oder MP4.",422);
 const id=randomUUID(),storageKey="voice-guidance/"+id;
 const item:Item={id,...metadata,mime,size:file.size,originalName:file.name.slice(0,240),storageKey};
 await putPrivateObject(storageKey,bytes,mime,true);
 try{await prisma.systemSetting.create({data:{key:key(id),value:item}});}catch(e){await deletePrivateObject(storageKey);throw e;}
 return NextResponse.json({ok:true,item:view(item)},{status:201});
}
export async function PATCH(request:Request){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);if(!isManager(user.role))return errorJson("Keine Berechtigung.",403);
 const form=await request.formData(),id=String(form.get("id")||""),metadata=parseMetadata(form);
 if(!validId(id)||!metadata)return errorJson("Ungültige Angaben.",422);
 const row=await prisma.systemSetting.findUnique({where:{key:key(id)}});if(!row)return errorJson("Nicht gefunden.",404);
 const previous=row.value as unknown as Item;
 const file=form.get("file");
 let item:Item={...previous,...metadata};
 let newKey:string|undefined;
 if(file instanceof File&&file.size>0){
  if(file.size>25*1024*1024)return errorJson("Datei zu groß (max. 25 MB).",422);
  const bytes=Buffer.from(await file.arrayBuffer()),mime=detectMime(bytes);
  if(!mime)return errorJson("Nur MP3, M4A oder MP4 ohne Videospur.",422);
  newKey="voice-guidance/"+randomUUID();
  await putPrivateObject(newKey,bytes,mime,true);
  item={...item,storageKey:newKey,mime,size:file.size,originalName:file.name.slice(0,240)};
 }
 try{
  const changed=await prisma.systemSetting.updateMany({where:{key:key(id),updatedAt:row.updatedAt},data:{value:item}});
  if(changed.count!==1){if(newKey)await deletePrivateObject(newKey);return errorJson("Eintrag wurde geändert. Bitte neu laden.",409);}
 }catch(e){if(newKey)await deletePrivateObject(newKey);throw e;}
 if(newKey)await deletePrivateObject(previous.storageKey);
 return NextResponse.json({ok:true,item:view(item)});
}

export async function DELETE(request:Request){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);if(!isManager(user.role))return errorJson("Keine Berechtigung.",403);
 const id=new URL(request.url).searchParams.get("id")||"";if(!validId(id))return errorJson("Nicht gefunden.",404);
 const row=await prisma.systemSetting.findUnique({where:{key:key(id)}});if(!row)return errorJson("Nicht gefunden.",404);
 const changed=await prisma.systemSetting.deleteMany({where:{key:key(id),updatedAt:row.updatedAt}});
 if(changed.count!==1)return errorJson("Eintrag wurde geändert. Bitte neu laden.",409);
 await deletePrivateObject((row.value as unknown as Item).storageKey);
 return NextResponse.json({ok:true});
}
