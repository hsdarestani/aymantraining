import {hasFeature} from "../../../lib/entitlements";
import {scoreView} from "../../../lib/score-view";
import {NextResponse} from "next/server";
import {calculateScore,type ScoreInput} from "../../../lib/score";
import {getDailyProfile} from "../../../lib/daily-profile-service";
import {prisma} from "../../../lib/db";
import {errorJson,requireApiUser} from "../../../lib/http";

export async function GET(){
  const user=await requireApiUser();
  if(!user)return errorJson("Nicht angemeldet.",401);
  const score=await prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}});
  const profile=await getDailyProfile(user.id);
  return NextResponse.json({ok:true,score:scoreView(score,await hasFeature(user.subscriptionTier,"score_details"),profile.journey.confirmedLevel),dailyProfile:profile},{headers:{"cache-control":"private, no-store"}});
}

export async function POST(request:Request){
  const body=await request.json() as {input:ScoreInput};
  const result=calculateScore(body.input);
  return NextResponse.json({...result,level:null,scoreIsLevel:false});
}
