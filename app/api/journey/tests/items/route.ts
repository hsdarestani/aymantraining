import {NextResponse} from "next/server";
import {z} from "zod";
import {testAccess,testError} from "../../../../../lib/journey-test-http";
import {markJourneyItemComplete} from "../../../../../lib/journey-service";
const input=z.object({enrollmentId:z.string().min(5),itemId:z.string().min(5)}).strict();
export async function POST(request:Request){
 const auth=await testAccess(request,"athlete");if("error" in auth)return auth.error;
 try{
  const data=input.parse(await request.json());
  const item=await markJourneyItemComplete(auth.user.id,data.enrollmentId,data.itemId);
  return NextResponse.json({ok:true,itemId:item.itemId,completedAt:item.completedAt});
 }catch(error){return testError(error);}
}
