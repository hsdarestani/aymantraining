import {prisma} from "../../../../lib/db";
import {errorJson,requireApiUser} from "../../../../lib/http";
import {getPrivateObject,InvalidMediaRange} from "../../../../lib/storage";

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const asset=await prisma.mediaAsset.findUnique({where:{id}});
  if(!asset)return errorJson("Datei nicht gefunden.",404);

  const publicExercise=["EXERCISE_IMAGE","EXERCISE_VIDEO"].includes(asset.kind);
  if(!publicExercise){
    const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
    let allowed=asset.ownerId===user.id||asset.relatedUserId===user.id||["COACH","ADMIN"].includes(user.role);
    if(!allowed&&asset.kind==="VOICE_MESSAGE"){
      const brief=await prisma.coachBrief.findFirst({where:{mediaId:asset.id,publishAt:{lte:new Date()},OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]},orderBy:{publishAt:"desc"}});
      const rank:Record<string,number>={FREE:0,PRO:1,ELITE:2};
      if(brief&&(rank[user.subscriptionTier]??0)>=(rank[brief.audienceTier]??0))allowed=true;
    }
    if(!allowed)return errorJson("Keine Berechtigung.",403);
  }

  try{
    const range=request.headers.get("range");
    const object=await getPrivateObject(asset.storageKey,range);
    if(!object.body)return errorJson("Datei nicht verfügbar.",404);
    const headers:Record<string,string>={
      "content-type":object.contentType||asset.mimeType,
      "accept-ranges":"bytes",
      "cache-control":publicExercise?"public, max-age=604800, immutable":"private, no-store",
      "content-disposition":`inline; filename="${encodeURIComponent(asset.originalName)}"`
    };
    if(object.size!=null)headers["content-length"]=String(object.size);
    if(object.contentRange)headers["content-range"]=object.contentRange;
    if(publicExercise)headers["x-bd-exercise-media"]="1";
    return new Response(object.body,{status:object.contentRange?206:200,headers});
  }catch(error){
    if(error instanceof InvalidMediaRange)return new Response(null,{status:416,headers:{"content-range":`bytes */${error.size}`,"accept-ranges":"bytes"}});
    return errorJson("Datei nicht verfügbar.",404);
  }
}
