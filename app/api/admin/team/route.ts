import {coachAthleteFilter} from "../../../../lib/coach-access";
import bcrypt from "bcryptjs";
import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {requireRole} from "../../../../lib/auth";
import {errorJson,isSameOrigin} from "../../../../lib/http";

const schema=z.discriminatedUnion("action",[
 z.object({action:z.literal("create_coach"),email:z.string().email(),name:z.string().min(2).max(100),password:z.string().min(10).max(200)}),
 z.object({action:z.literal("assign"),athleteId:z.string(),coachId:z.string()}),
 z.object({action:z.literal("unassign"),athleteId:z.string(),coachId:z.string()})
]);
export async function GET(){
 const actor=await requireRole(["COACH","ADMIN"]),filter=await coachAthleteFilter(actor);
 const [coaches,athletes,assignments]=await Promise.all([
  prisma.user.findMany({where:{role:{in:["COACH","ADMIN"]}},select:{id:true,name:true,email:true,role:true},orderBy:{createdAt:"asc"}}),
  prisma.user.findMany({where:{role:"ATHLETE",...(filter.userId?{id:filter.userId}:{})},select:{id:true,name:true,email:true,subscriptionTier:true},orderBy:{name:"asc"}}),
  prisma.coachAssignment.findMany({where:{active:true,...(actor.role==="COACH"?{coachId:actor.id}:{})}})
 ]);
 return NextResponse.json({ok:true,coaches,athletes,assignments});
}
export async function POST(request:Request){
 const me=await requireRole(["ADMIN"]);
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return errorJson("Ungültige Team Aktion.",422);
 if(p.data.action==="create_coach"){
  const exists=await prisma.user.findUnique({where:{email:p.data.email.toLowerCase()}});if(exists)return errorJson("E Mail bereits vorhanden.",409);
  const passwordHash=await bcrypt.hash(p.data.password,12);
  const user=await prisma.user.create({data:{email:p.data.email.toLowerCase(),name:p.data.name,passwordHash,role:"COACH",onboardingCompleted:true}});
  return NextResponse.json({ok:true,user:{id:user.id,name:user.name,email:user.email}});
 }
 if(p.data.action==="assign"){
  const [athlete,coach]=await Promise.all([prisma.user.findFirst({where:{id:p.data.athleteId,role:"ATHLETE"}}),prisma.user.findFirst({where:{id:p.data.coachId,role:{in:["COACH","ADMIN"]}}})]);
  if(!athlete||!coach)return errorJson("Athlet oder Trainer nicht gefunden.",404);
  await prisma.coachAssignment.updateMany({where:{athleteId:athlete.id,active:true},data:{active:false,endsAt:new Date()}});
  const item=await prisma.coachAssignment.create({data:{athleteId:athlete.id,coachId:coach.id}});
  return NextResponse.json({ok:true,item});
 }
 await prisma.coachAssignment.updateMany({where:{athleteId:p.data.athleteId,coachId:p.data.coachId,active:true},data:{active:false,endsAt:new Date()}});
 return NextResponse.json({ok:true});
}
