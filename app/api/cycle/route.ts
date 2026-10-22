import {NextResponse} from "next/server";
import {errorJson,requireApiUser} from "../../../lib/http";
import {cycleFeatureEnabled} from "../../../lib/cycle-contract";
import {cyclePrivateHeaders,privateCycle} from "../../../lib/cycle-service";
export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 if(!cycleFeatureEnabled())return NextResponse.json({ok:true,enabled:false,available:false},{headers:cyclePrivateHeaders});
 return NextResponse.json({ok:true,...await privateCycle(user.id)},{headers:cyclePrivateHeaders});
}
