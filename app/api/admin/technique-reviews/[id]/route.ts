import {NextResponse} from "next/server";
import {z} from "zod";
import {errorJson,requireApiUser,isSameOrigin} from "../../../../../lib/http";
import {reviewTechnique} from "../../../../../lib/step09-coaching";
const body=z.object({feedbackDe:z.string().trim().min(10).max(2000),
 nextSessionCueDe:z.string().trim().min(5).max(800).optional(),
 targetWorkoutId:z.string().min(5).optional()}).strict();
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(!["COACH","ADMIN"].includes(user.role))return errorJson("Nur für Trainer.",403);
 if(process.env.STEP09_ENABLED!=="true")return errorJson("Noch nicht freigeschaltet.",503);
 const {id}=await params,parsed=body.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return errorJson("Bitte eine konkrete Trainerantwort eingeben.",422);
 if(parsed.data.targetWorkoutId&&!parsed.data.nextSessionCueDe)return errorJson("Hinweis für diese Einheit fehlt.",422);
 try{const review=await reviewTechnique({actor:user,reviewId:id,...parsed.data});return NextResponse.json({ok:true,review});}
 catch(error){const msg=error instanceof Error?error.message:"";
 return errorJson(msg==="NOT_ASSIGNED"?"Keine Berechtigung für diesen Athleten.":msg==="ALREADY_REVIEWED"?"Diese Rückmeldung wurde bereits gespeichert.":"Workout oder Review nicht verfügbar.",
 msg==="NOT_ASSIGNED"?403:msg==="ALREADY_REVIEWED"?409:422);}
}