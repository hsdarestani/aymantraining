import {NextResponse} from "next/server";
import {testAccess,testError} from "../../../../lib/journey-test-http";
import {listPendingJourneyReviews} from "../../../../lib/journey-test-views";
export async function GET(request:Request){
 const auth=await testAccess(request,"coach");if("error" in auth)return auth.error;
 try{return NextResponse.json({ok:true,attempts:await listPendingJourneyReviews(auth.user)});}
 catch(error){return testError(error);}
}
