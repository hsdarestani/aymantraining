import {prisma} from "../../../../lib/db";
import {errorJson,requireApiUser} from "../../../../lib/http";
import {getPrivateObject} from "../../../../lib/storage";

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
  const {id}=await params;const asset=await prisma.mediaAsset.findUnique({where:{id}});
  if(!asset)return errorJson("Datei nicht gefunden.",404);
  const allowed=asset.ownerId===user.id||asset.relatedUserId===user.id||["COACH","ADMIN"].includes(user.role)||["EXERCISE_IMAGE","EXERCISE_VIDEO"].includes(asset.kind);
  if(!allowed)return errorJson("Keine Berechtigung.",403);
  try{
    const range=request.headers.get("range");
    const object=await getPrivateObject(asset.storageKey,range);
    if(!object.body)return errorJson("Datei nicht verfügbar.",404);
    const headers:Record<string,string>={
      "content-type":object.contentType||asset.mimeType,
      "accept-ranges":"bytes",
      "cache-control":["EXERCISE_IMAGE","EXERCISE_VIDEO"].includes(asset.kind)?"private, max-age=604800":"private, no-store",
      "content-disposition":`inline; filename="${encodeURIComponent(asset.originalName)}"`
    };
    if(object.size!=null)headers["content-length"]=String(object.size);
    if(object.contentRange)headers["content-range"]=object.contentRange;
    if(["EXERCISE_IMAGE","EXERCISE_VIDEO"].includes(asset.kind))headers["x-bd-exercise-media"]="1";
    return new Response(object.body,{status:object.contentRange?206:200,headers});
  }catch{return errorJson("Datei nicht verfügbar.",404);}
}
