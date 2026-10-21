import {NextResponse} from "next/server";
import {editorActor,coachEditorError} from "../../../../../../lib/journey-editor-http";
import {publishCoachJourneyVersion} from "../../../../../../lib/journey-editor-service";
type Context={params:Promise<{versionId:string}>};
export async function POST(request:Request,{params}:Context){
 const a=await editorActor(request,true);if("error" in a)return a.error;
 try{const {versionId}=await params;return NextResponse.json({ok:true,...await publishCoachJourneyVersion(a.user.id,versionId)});}
 catch(e){return coachEditorError(e);}
}
