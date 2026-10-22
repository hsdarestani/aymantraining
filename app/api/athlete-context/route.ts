import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser} from "../../../lib/http";
import {evaluateRecommendations} from "../../../lib/recommendations";

const schema=z.object({
 nextMatchAt:z.string().datetime().optional().nullable(),
 travelModeUntil:z.string().datetime().optional().nullable(),
 targetScore:z.number().int().min(0).max(100).optional().nullable(),
 targetDate:z.string().datetime().optional().nullable(),
 bedtimeTarget:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional().nullable(),
 stepTarget:z.number().int().min(1000).max(100000).optional(),
 waterTargetMl:z.number().int().min(500).max(10000).optional(),
 proteinTargetG:z.number().min(0).max(500).optional(),
 preferredMorningHour:z.number().int().min(4).max(12).optional()
});

export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const item=await prisma.athleteContext.findUnique({where:{userId:user.id}});
 return NextResponse.json({ok:true,item:{...(item??{userId:user.id,stepTarget:10000,waterTargetMl:2500,proteinTargetG:130,preferredMorningHour:8}),cycleTrackingEnabled:false,cycleStartDate:null,cycleLengthDays:28}},{headers:{"cache-control":"private, no-store"}});
}
export async function POST(request:Request){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const body=await request.json().catch(()=>null);
 if(body?.cycleTrackingEnabled===true||body?.cycleStartDate)return errorJson("Zyklusdaten nur mit gesonderter Zustimmung.",409);
 const {cycleTrackingEnabled:_old,cycleStartDate:_start,cycleLengthDays:_length,...ordinary}=body&&typeof body==="object"?body:{};
 const p=schema.safeParse(ordinary);if(!p.success)return errorJson("Ungültiger Trainingskontext.",422);
 const d=p.data;
 const data:any={...d,cycleTrackingEnabled:false,cycleStartDate:null,cycleLengthDays:28};
 for(const k of ["nextMatchAt","travelModeUntil","targetDate"] as const)if(k in d)data[k]=(d as any)[k]?(new Date((d as any)[k])):null;
 const item=await prisma.athleteContext.upsert({where:{userId:user.id},update:data,create:{userId:user.id,...data}});
 await evaluateRecommendations(user.id);
 return NextResponse.json({ok:true,item:{...item,cycleTrackingEnabled:false,cycleStartDate:null,cycleLengthDays:28}},{headers:{"cache-control":"private, no-store"}});
}
