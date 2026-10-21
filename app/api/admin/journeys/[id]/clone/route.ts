import {NextResponse} from "next/server";
import {editorActor,coachEditorError} from "../../../../../../lib/journey-editor-http";
import {cloneCoachJourneyVersion} from "../../../../../../lib/journey-editor-service";
type Context={params:Promise<{id:string}>};
export async function POST(request:Request,{params}:Context){
 const a=await editorActor(request,true);if("error" in a)return a.error;
 try{const {id}=await params;return NextResponse.json({ok:true,...await cloneCoachJourneyVersion(a.user.id,id)},{status:201});}
 catch(e){return coachEditorError(e);}
}
