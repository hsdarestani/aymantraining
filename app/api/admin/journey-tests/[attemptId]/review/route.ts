import {NextResponse} from "next/server";
import {z} from "zod";
import {testAccess,testError} from "../../../../../../lib/journey-test-http";
import {reviewJourneyAttempt} from "../../../../../../lib/journey-service";
import {prisma} from "../../../../../../lib/db";
import {queueNotification} from "../../../../../../lib/notifications";
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
  if(!result.replayed){
    const attempt=await prisma.journeyTestAttempt.findUnique({where:{id:attemptId},
      select:{enrollment:{select:{userId:true}},assessment:{select:{titleDe:true}}}});
    if(attempt)await queueNotification({
      userId:attempt.enrollment.userId,category:"test_result",
      title:result.verdict==="PASSED"?"Prüfung bestanden":"Rückmeldung zu deinem Test",
      body:result.verdict==="PASSED"?
       "Dein Trainer hat den Test bestätigt. Sieh dir deinen nächsten Schritt an.":
       "Dein Trainer hat deinen Test geprüft. Sieh dir die Hinweise für deinen nächsten Versuch an.",
      data:{route:"/journey-tests",attemptId}
    }).catch(()=>null);
  }
  return NextResponse.json({ok:true,...result});
 }catch(error){return testError(error);}
}
