import {NextResponse} from "next/server";
import {calculateScore,levelForScore,type ScoreInput} from "../../../lib/score";

export async function POST(request:Request){
  const body=await request.json() as {input:ScoreInput};
  const result=calculateScore(body.input);
  return NextResponse.json({...result,level:result.score===null?null:levelForScore(result.score)});
}
