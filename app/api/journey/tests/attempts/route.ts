import {NextResponse} from "next/server";
import {z} from "zod";
import {testAccess,testError} from "../../../../../lib/journey-test-http";
import {journeyResultsSchema} from "../../../../../lib/journey-contract";
import {submitJourneyAssessment} from "../../../../../lib/journey-service";
const input=z.object({
 enrollmentId:z.string().min(5),assessmentId:z.string().min(5),
 idempotencyKey:z.string().min(8).max(128),results:journeyResultsSchema
}).strict();
export async function POST(request:Request){
 const auth=await testAccess(request,"athlete");if("error" in auth)return auth.error;
 try{
  const data=input.parse(await request.json());
  const attempt=await submitJourneyAssessment({...data,userId:auth.user.id});
  return NextResponse.json({ok:true,attempt:{
   id:attempt.id,assessmentId:attempt.assessmentId,verdict:attempt.verdict,
   submittedAt:attempt.submittedAt
  }});
 }catch(error){return testError(error);}
}
