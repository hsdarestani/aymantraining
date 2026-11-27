import {NextResponse} from "next/server";
import {prisma} from "../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser} from "../../../lib/http";
export const dynamic="force-dynamic";
const headers={"cache-control":"private, no-store"};
export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const row=await prisma.systemSetting.findUnique({where:{key:"voice_preference:"+user.id}});
 return NextResponse.json({enabled:row?.value===true},{headers});
}
export async function PATCH(request:Request){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const data=await request.json().catch(()=>null);
 if(typeof data?.enabled!=="boolean")return errorJson("Ungültige Angaben.",422);
 const key="voice_preference:"+user.id;
 await prisma.systemSetting.upsert({where:{key},create:{key,value:data.enabled},update:{value:data.enabled}});
 return NextResponse.json({enabled:data.enabled},{headers});
}
