import {NextResponse} from "next/server";
import {editorActor,coachEditorError} from "../../../../../lib/journey-editor-http";
import {getCoachJourneyVersion,saveCoachJourneyDraft} from "../../../../../lib/journey-editor-service";
type Context={params:Promise<{versionId:string}>};
export async function GET(request:Request,{params}:Context){
 const a=await editorActor(request);if("error" in a)return a.error;
 try{const {versionId}=await params;return NextResponse.json({ok:true,version:await getCoachJourneyVersion(a.user.id,versionId)});}
 catch(e){return coachEditorError(e);}
}
export async function PUT(request:Request,{params}:Context){
 const a=await editorActor(request,true);if("error" in a)return a.error;
 try{const {versionId}=await params;const draft=await request.json();return NextResponse.json({ok:true,...await saveCoachJourneyDraft(a.user.id,versionId,draft)});}
 catch(e){return coachEditorError(e);}
}
