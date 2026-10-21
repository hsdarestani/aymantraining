import {NextResponse} from "next/server";
import {editorActor,coachEditorError} from "../../../../lib/journey-editor-http";
import {listCoachJourneys,createCoachJourney} from "../../../../lib/journey-editor-service";
export async function GET(request:Request){
 const a=await editorActor(request);if("error" in a)return a.error;
 try{return NextResponse.json({ok:true,...await listCoachJourneys(a.user.id)});}catch(e){return coachEditorError(e);}
}
export async function POST(request:Request){
 const a=await editorActor(request,true);if("error" in a)return a.error;
 try{const input=await request.json();return NextResponse.json({ok:true,...await createCoachJourney(a.user.id,input)},{status:201});}
 catch(e){return coachEditorError(e);}
}
