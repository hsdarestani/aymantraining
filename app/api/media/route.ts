import crypto from "node:crypto";
import {NextResponse} from "next/server";
import {prisma} from "../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser} from "../../../lib/http";
import {hasFeature} from "../../../lib/entitlements";
import {putPrivateObject} from "../../../lib/storage";

const allowed={
  PROGRESS_PHOTO:{mime:/^image\/(jpeg|png|webp)$/,max:12*1024*1024},
  TECHNIQUE_VIDEO:{mime:/^video\/(mp4|quicktime|webm)$/,max:100*1024*1024},
  TEST_VIDEO:{mime:/^video\/(mp4|quicktime|webm)$/,max:100*1024*1024},
  VOICE_MESSAGE:{mime:/^audio\/(mpeg|mp4|webm|ogg|wav|x-m4a)$/,max:25*1024*1024},
  EXERCISE_IMAGE:{mime:/^image\/(jpeg|png|webp)$/,max:12*1024*1024},
  EXERCISE_VIDEO:{mime:/^video\/(mp4|quicktime|webm)$/,max:100*1024*1024}
} as const;

export async function GET(request:Request){
  const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
  const url=new URL(request.url);const kind=url.searchParams.get("kind");
  const allowedKinds=new Set(["PROGRESS_PHOTO","TECHNIQUE_VIDEO","TEST_VIDEO","VOICE_MESSAGE"]);
  if(kind&&!allowedKinds.has(kind))return errorJson("Ungültiger Medientyp.",422);
  const items=await prisma.mediaAsset.findMany({where:{relatedUserId:user.id,...(kind?{kind:kind as any}:{})},orderBy:{createdAt:"desc"},take:100});
  return NextResponse.json({ok:true,items:items.map(x=>({id:x.id,kind:x.kind,originalName:x.originalName,mimeType:x.mimeType,sizeBytes:x.sizeBytes,createdAt:x.createdAt}))});
}

export async function POST(request:Request){
  if(!isSameOrigin(request)&&request.headers.get("x-bd-client")!=="mobile")return errorJson("Ungültige Anfrage.",403);
  const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
  const form=await request.formData();const file=form.get("file");
  const kind=String(form.get("kind")||"") as keyof typeof allowed;
  const relatedUserId=form.get("relatedUserId")?String(form.get("relatedUserId")):user.id;
  if(!(file instanceof File)||!allowed[kind])return errorJson("Datei oder Typ ungültig.",422);
  if((kind==="EXERCISE_IMAGE"||kind==="EXERCISE_VIDEO")&&!["COACH","ADMIN"].includes(user.role))return errorJson("Keine Berechtigung.",403);
  if(user.role==="ATHLETE"&&(kind==="VOICE_MESSAGE"||kind==="TECHNIQUE_VIDEO")&&!await hasFeature(user.subscriptionTier,"coach_chat"))return errorJson("Coach Media ist PRO.",403);
  if(user.role==="ATHLETE"&&kind==="TECHNIQUE_VIDEO"){
    const row=await prisma.systemSetting.findUnique({where:{key:"app_settings"}});
    const limit=Math.max(0,Number((row?.value as any)?.videoAnalysesPerMonth??2));
    if(limit>0){
      const start=new Date();start.setUTCDate(1);start.setUTCHours(0,0,0,0);
      const used=await prisma.mediaAsset.count({where:{relatedUserId:user.id,kind:"TECHNIQUE_VIDEO",createdAt:{gte:start}}});
      if(used>=limit)return errorJson(`Dein Kontingent von ${limit} Videoanalysen für diesen Monat ist erreicht.`,403);
    }
  }
  if(kind==="PROGRESS_PHOTO"&&user.subscriptionTier==="FREE"){
    const count=await prisma.mediaAsset.count({where:{relatedUserId:user.id,kind:"PROGRESS_PHOTO"}});
    if(count>=3)return errorJson("Im FREE Plan sind maximal 3 Fortschrittsbilder möglich.",403);
  }
  const rule=allowed[kind];
  if(!rule.mime.test(file.type)||file.size<=0||file.size>rule.max)return errorJson("Dateiformat oder Größe nicht erlaubt.",422);
  if(relatedUserId!==user.id&&!["COACH","ADMIN"].includes(user.role))return errorJson("Keine Berechtigung.",403);
  if(kind==="PROGRESS_PHOTO"||kind==="TECHNIQUE_VIDEO"||kind==="TEST_VIDEO"){
    const consent=await prisma.consentRecord.findFirst({where:{userId:relatedUserId,type:"media_processing"},orderBy:{grantedAt:"desc"}});
    if(!consent?.granted)return errorJson("Bitte bestätige zuerst die Verarbeitung privater Fotos/Videos.",403);
  }
  const key=`media/${new Date().getUTCFullYear()}/${crypto.randomUUID()}`;
  const sensitive=!["EXERCISE_IMAGE","EXERCISE_VIDEO"].includes(kind);\n  await putPrivateObject(key,Buffer.from(await file.arrayBuffer()),file.type,sensitive);
  const asset=await prisma.mediaAsset.create({data:{ownerId:user.id,relatedUserId,kind,storageKey:key,originalName:file.name.slice(0,240),mimeType:file.type,sizeBytes:file.size}});
  return NextResponse.json({ok:true,asset:{id:asset.id,kind:asset.kind,sizeBytes:asset.sizeBytes}});
}
