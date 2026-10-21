import {NextResponse} from "next/server";
import {z} from "zod";
import {editorActor,coachEditorError} from "../../../../../lib/journey-editor-http";
import {cloneCoachJourneyVersion} from "../../../../../lib/journey-editor-service";
export async function POST(request:Request){
 const a=await editorActor(request,true);if("error" in a)return a.error;
 try{
  const parsed=z.object({pathwayId:z.string().min(5)}).strict().parse(await request.json());
  return NextResponse.json({ok:true,...await cloneCoachJourneyVersion(a.user.id,parsed.pathwayId)},{status:201});
 }catch(e){return coachEditorError(e);}
}
