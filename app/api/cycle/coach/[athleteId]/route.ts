import {NextResponse} from "next/server";
import {errorJson,requireApiUser} from "../../../../../lib/http";
import {cycleFeatureEnabled} from "../../../../../lib/cycle-contract";
import {cyclePrivateHeaders,getCoachCycleSignals} from "../../../../../lib/cycle-service";
export async function GET(_request:Request,{params}:{params:Promise<{athleteId:string}>}){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(!cycleFeatureEnabled())return errorJson("Nicht verfügbar.",404);
 const {athleteId}=await params;
 const shared=await getCoachCycleSignals(user,athleteId);
 if(!shared)return errorJson("Keine Freigabe.",403);
 return NextResponse.json({ok:true,...shared},{headers:cyclePrivateHeaders});
}
