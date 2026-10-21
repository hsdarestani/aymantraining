import {NextResponse} from "next/server";
import {requireApiUser} from "../../../../lib/http";
import {prisma} from "../../../../lib/db";
import {JOURNEY_LEVEL_DESCRIPTIONS,JOURNEY_ONBOARDING_GOALS} from "../../../../lib/journey-onboarding";

/** Read-only and protected. Never interprets the old Score as an earned level. */
export async function GET(){
  const user=await requireApiUser();
  if(!user)return NextResponse.json({ok:false,error:"Nicht angemeldet."},{status:401});
  if(process.env.JOURNEY_ONBOARDING_ENABLED!=="true")
    return NextResponse.json({ok:true,enabled:false,goals:JOURNEY_ONBOARDING_GOALS,levels:JOURNEY_LEVEL_DESCRIPTIONS});
  const intake=await prisma.journeyIntake.findUnique({where:{userId:user.id}});
  const enrollment=intake?.matchedVersionId?await prisma.journeyEnrollment.findUnique({
    where:{userId_versionId:{userId:user.id,versionId:intake.matchedVersionId}},
    select:{id:true,state:true,selfLevel:true,confirmedLevel:true,confirmedAt:true}
  }):null;
  return NextResponse.json({ok:true,enabled:true,
    goals:JOURNEY_ONBOARDING_GOALS,levels:JOURNEY_LEVEL_DESCRIPTIONS,
    journey:intake?{
      status:enrollment?.confirmedLevel?"CONFIRMED":intake.status,
      selectedGoals:intake.selectedGoalSlugs,selfLevel:intake.selfLevel,
      dashboard:intake.dashboard,matchedVersionId:intake.matchedVersionId,
      confirmedLevel:enrollment?.confirmedLevel??null,confirmedAt:enrollment?.confirmedAt??null
    }:null
  });
}
