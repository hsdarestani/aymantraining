import crypto from "node:crypto";
import {NextResponse} from "next/server";
import {prisma} from "../../../../../lib/db";
import {recomputeScoreForUser} from "../../../../../lib/scoring";
import {evaluateRecommendations} from "../../../../../lib/recommendations";
import {dateOnly} from "../../../../../lib/http";
function safeEqual(a:string,b:string){try{return crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b))}catch{return false}}
export async function POST(request:Request,{params}:{params:Promise<{provider:string}>}){
 const secret=process.env.WEARABLE_AGGREGATOR_SECRET;if(!secret)return NextResponse.json({ok:false,error:"not_configured"},{status:503});
 const raw=await request.text(),sig=request.headers.get("x-bd-signature")||"",expected=crypto.createHmac("sha256",secret).update(raw).digest("hex");
 if(!safeEqual(sig,expected))return NextResponse.json({ok:false,error:"unauthorized"},{status:401});
 const {provider}=await params;const body=JSON.parse(raw||"{}"),externalUserId=String(body.externalUserId||"");
 const conn=await prisma.wearableConnection.findFirst({where:{provider:provider.toLowerCase(),externalUserId,status:"CONNECTED"}});if(!conn)return NextResponse.json({ok:false,error:"connection_not_found"},{status:404});
 const date=dateOnly(body.date?new Date(body.date):new Date());
 const data={steps:num(body.steps),activeCalories:num(body.activeCalories),totalCalories:num(body.totalCalories),restingHr:num(body.restingHr),hrv:num(body.hrv),sleepMinutes:int(body.sleepMinutes),sleepStages:body.sleepStages||undefined,vo2max:num(body.vo2max),workouts:body.workouts||undefined,weightKg:num(body.weightKg),completeness:complete(body)};
 await prisma.wearableDaily.upsert({where:{userId_date_source:{userId:conn.userId,date,source:provider.toLowerCase()}},update:data,create:{userId:conn.userId,date,source:provider.toLowerCase(),...data}});
 await prisma.wearableConnection.update({where:{id:conn.id},data:{lastSyncAt:new Date()}});
 await Promise.all([recomputeScoreForUser(conn.userId),evaluateRecommendations(conn.userId)]);
 return NextResponse.json({ok:true});
}
function num(v:any){const n=Number(v);return Number.isFinite(n)?n:undefined}
function int(v:any){const n=Number(v);return Number.isFinite(n)?Math.round(n):undefined}
function complete(b:any){const keys=["steps","activeCalories","restingHr","hrv","sleepMinutes","vo2max","weightKg"];return Math.round(keys.filter(k=>b[k]!=null).length/keys.length*100)}
