import {NextResponse} from "next/server";
import {z} from "zod";
import {JourneyLevel} from "@prisma/client";
import {prisma} from "../../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser} from "../../../../lib/http";
import {JOURNEY_LEVELS} from "../../../../lib/journey-contract";
import {confirmJourneyPlacement} from "../../../../lib/journey-service";

const approveSchema=z.object({
  enrollmentId:z.string().min(5).max(128),
  confirmedLevel:z.enum(JOURNEY_LEVELS),
  passedPlacementAttemptId:z.string().min(5).optional()
}).strict();

// Only authorized coaches/admins, never athletes, can approve placement.
// The service independently verifies coach assignment and published content.
export async function POST(request:Request){
  if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
  if(process.env.JOURNEY_ONBOARDING_ENABLED!=="true")
    return errorJson("Der Trainingsweg ist noch nicht aktiviert.",503,"JOURNEY_NOT_ENABLED");
  const user=await requireApiUser();
  if(!user)return errorJson("Nicht angemeldet.",401);
  if(user.role!=="ADMIN"&&user.role!=="COACH")return errorJson("Nicht berechtigt.",403);
  const parsed=approveSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return errorJson("Ungültiger Einstufungsauftrag.",422);
  try{
    const result=await confirmJourneyPlacement({
      enrollmentId:parsed.data.enrollmentId,level:parsed.data.confirmedLevel as JourneyLevel,
      approvedById:user.id,reason:parsed.data.passedPlacementAttemptId?"PLACEMENT_TEST":"COACH_APPROVAL",
      passedPlacementAttemptId:parsed.data.passedPlacementAttemptId
    });
    return NextResponse.json({ok:true,...result});
  }catch{
    // Avoid revealing another athlete's enrollment / coach linkage in response.
    return errorJson("Freigabe nicht möglich. Bitte die Trainerzuordnung und den veröffentlichten Trainingsweg prüfen.",409);
  }
}

export async function GET(){
  if(process.env.JOURNEY_ONBOARDING_ENABLED!=="true")
    return errorJson("Der Trainingsweg ist noch nicht aktiviert.",503,"JOURNEY_NOT_ENABLED");
  const user=await requireApiUser();
  if(!user)return errorJson("Nicht angemeldet.",401);
  if(user.role!=="ADMIN"&&user.role!=="COACH")return errorJson("Nicht berechtigt.",403);
  const where=user.role==="ADMIN"?{state:"PENDING" as const}:{
    state:"PENDING" as const,user:{coachAssignments:{some:{
      coachId:user.id,active:true,OR:[{endsAt:null},{endsAt:{gt:new Date()}}]
    }}}
  };
  const pending=await prisma.journeyEnrollment.findMany({
    where,select:{
      id:true,userId:true,selfLevel:true,state:true,versionId:true,
      version:{select:{pathway:{select:{titleDe:true}},levels:{select:{code:true}}}},
      user:{select:{name:true}}
    },orderBy:{startedAt:"asc"},take:100
  });
  return NextResponse.json({ok:true,pending});
}
