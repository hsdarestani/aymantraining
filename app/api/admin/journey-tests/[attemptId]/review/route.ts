import {NextResponse} from "next/server";
import {z} from "zod";
import {testAccess,testError} from "../../../../../../lib/journey-test-http";
import {reviewJourneyAttempt} from "../../../../../../lib/journey-service";
const schema=z.object({coachFeedbackDe:z.string().trim().min(5).max(2000)}).strict();
type Context={params:Promise<{attemptId:string}>};
export async function POST(request:Request,{params}:Context){
 const auth=await testAccess(request,"coach");if("error" in auth)return auth.error;
 try{
  const data=schema.parse(await request.json());
  const {attemptId}=await params;
  const result=await reviewJourneyAttempt({
   attemptId,reviewerId:auth.user.id,coachFeedbackDe:data.coachFeedbackDe
  });
  return NextResponse.json({ok:true,...result});
 }catch(error){return testError(error);}
}
