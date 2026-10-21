import {NextResponse} from "next/server";
import {testAccess,testError} from "../../../../lib/journey-test-http";
import {listAthleteJourneyTests} from "../../../../lib/journey-test-views";
export async function GET(request:Request){
 const auth=await testAccess(request,"read");if("error" in auth)return auth.error;
 if(auth.user.role!=="ATHLETE")return NextResponse.json({ok:true,enrollments:[]});
 try{return NextResponse.json({ok:true,enrollments:await listAthleteJourneyTests(auth.user.id)});}
 catch(error){return testError(error);}
}
