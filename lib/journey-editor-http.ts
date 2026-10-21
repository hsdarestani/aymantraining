import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {requireApiUser,isSameOrigin,errorJson} from "./http";

export async function editorActor(request:Request,write=false){
 if(process.env.JOURNEY_EDITOR_ENABLED!=="true")
  return {error:errorJson("Der Coach Wegeditor ist noch nicht aktiviert.",503,"JOURNEY_EDITOR_DISABLED")} as const;
 const user=await requireApiUser();
 if(!user)return {error:errorJson("Nicht angemeldet.",401)} as const;
 if(user.role!=="COACH"&&user.role!=="ADMIN")return {error:errorJson("Nicht berechtigt.",403)} as const;
 if(write&&!isSameOrigin(request))return {error:errorJson("Ungültige Anfrage.",403)} as const;
 return {user} as const;
}
export function coachEditorError(err:unknown){
 if(err instanceof ZodError)return errorJson(err.issues.map(x=>x.message).slice(0,4).join(" "),422);
 const message=err instanceof Error?err.message:"";
 if(message.startsWith("INCOMPLETE:"))return errorJson(message.slice(11),422,"CURRICULUM_INCOMPLETE");
 if(["REVISION_CONFLICT","DRAFT_ALREADY_EXISTS","DUPLICATE_COMBINATION","PUBLISHED_IMMUTABLE","ENROLLED_IMMUTABLE"].includes(message))
  return errorJson("Die Version wurde geändert oder ist bereits veröffentlicht. Bitte neu laden.",409,message);
 if(["INVALID_MEDIA","INVALID_MEDIA_KIND","INVALID_PLAN","INVALID_EXERCISE","PRIVATE_MEDIA","MISSING_GOALS","NOT_PUBLISHED"].includes(message))
  return errorJson("Bitte Medien, Trainingsinhalte und Zielzuordnung prüfen.",422,message);
 if(message==="NOT_FOUND")return errorJson("Trainingsweg nicht gefunden.",404);
 return errorJson("Die Änderung konnte nicht gespeichert werden.",500);
}
