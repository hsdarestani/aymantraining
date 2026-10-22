import {inspectJourneyMediaAccess} from "../../../../lib/journey-service";
import {canReadLegacyExerciseVideo} from "../../../../lib/legacy-media-access";
import {canCoachAccess} from "../../../../lib/coach-access";
import {prisma} from "../../../../lib/db";
import {errorJson,requireApiUser} from "../../../../lib/http";
import {getPrivateObject,InvalidMediaRange} from "../../../../lib/storage";

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const asset=await prisma.mediaAsset.findUnique({where:{id}});
  if(!asset)return errorJson("Datei nicht gefunden.",404);

  const exerciseAsset=["EXERCISE_IMAGE","EXERCISE_VIDEO"].includes(asset.kind);
  // Preserve legacy public exercise files while the new system is disabled.
  // Once a media asset is attached to a Journey item, never serve it publicly,
  // including while the version is still in draft.
  const isolatedJourneyAsset=asset.storageKey.startsWith("journey-media/");
  // A rollback of the Journey feature must not accidentally make newly filmed PRO clips public.
  if(isolatedJourneyAsset&&process.env.JOURNEY_EDITOR_ENABLED!=="true")return errorJson("Medium derzeit nicht freigeschaltet.",403);
  const journeyVariants=exerciseAsset&&process.env.JOURNEY_EDITOR_ENABLED==="true"?
    await prisma.chapterMediaVariant.findMany({where:{mediaAssetId:asset.id},select:{id:true},take:100}):[];
  const journeyProtected=isolatedJourneyAsset||journeyVariants.length>0;
  // Legacy video URLs must never be anonymously streamable or grant free tier access.
  const publicExercise=asset.kind==="EXERCISE_IMAGE"&&!journeyProtected;
  if(journeyProtected){
    const user=await requireApiUser();
    if(!user)return errorJson("Nicht angemeldet.",401);
    // Admin may QA all content; a coach may preview only uploads they own.
    // Other coaches require a direct athlete assignment for user media, not a global bypass.
    let allowed=user.role==="ADMIN"||(user.role==="COACH"&&asset.ownerId===user.id);
    if(!allowed){
      for(const variant of journeyVariants){
        if((await inspectJourneyMediaAccess(user.id,variant.id)).allowed){allowed=true;break;}
      }
    }
    if(!allowed)return errorJson("Dieses Kapitel oder PRO Medium ist nicht freigeschaltet.",403);
  }else if(asset.kind==="EXERCISE_VIDEO"){
    const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
    if(!await canReadLegacyExerciseVideo({
      userId:user.id,assetId:asset.id,tier:user.subscriptionTier,role:user.role
    }))return errorJson("Video benötigt PRO und eine gültige Trainingszuordnung.",403);
  }else if(!publicExercise){
    const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
    let allowed=asset.ownerId===user.id||asset.relatedUserId===user.id||user.role==="ADMIN"||(user.role==="COACH"&&await canCoachAccess(user,asset.relatedUserId||asset.ownerId));
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
      "cache-control":publicExercise?"public, max-age=3600":"private, no-store",
      "x-content-type-options":"nosniff",
      "vary":"Cookie, Authorization",
      "content-disposition":`inline; filename="${encodeURIComponent(asset.originalName)}"`
    };
    if(object.size!=null)headers["content-length"]=String(object.size);
    if(object.contentRange)headers["content-range"]=object.contentRange;
    if(publicExercise)headers["x-bd-exercise-media"]="1";
    if(asset.kind==="EXERCISE_VIDEO"||journeyProtected)headers["x-robots-tag"]="noindex, nofollow";
    return new Response(object.body,{status:object.contentRange?206:200,headers});
  }catch(error){
    if(error instanceof InvalidMediaRange)return new Response(null,{status:416,headers:{"content-range":`bytes */${error.size}`,"accept-ranges":"bytes"}});
    return errorJson("Datei nicht verfügbar.",404);
  }
}
