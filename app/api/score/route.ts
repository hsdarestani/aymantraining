import {hasFeature} from "../../../lib/entitlements";
import {scoreView} from "../../../lib/score-view";
import {NextResponse} from "next/server";
import {calculateScore,levelForScore,type ScoreInput} from "../../../lib/score";
import {prisma} from "../../../lib/db";
import {errorJson,requireApiUser} from "../../../lib/http";

export async function GET(){
  const user=await requireApiUser();
  if(!user)return errorJson("Nicht angemeldet.",401);
  const score=await prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}});
  return NextResponse.json({ok:true,score:scoreView(score,await hasFeature(user.subscriptionTier,"score_details"))});
}

export async function POST(request:Request){
  const body=await request.json() as {input:ScoreInput};
  const result=calculateScore(body.input);
  return NextResponse.json({...result,level:result.score===null?null:levelForScore(result.score)});
}
