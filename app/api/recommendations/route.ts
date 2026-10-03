import {NextResponse} from "next/server";
import {recommendations,type DailySignals} from "../../../lib/score";

export async function POST(request:Request){
  const body=await request.json() as DailySignals;
  return NextResponse.json({recommendations:recommendations(body)});
}
