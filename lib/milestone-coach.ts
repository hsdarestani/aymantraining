import {prisma} from "./db";
export async function canManageMilestoneAthlete(actor:{id:string;role:string},athleteId:string){
 if(actor.role!=="COACH"&&actor.role!=="ADMIN")return false;
 const athlete=await prisma.user.findFirst({where:{id:athleteId,role:"ATHLETE"},select:{id:true}});
 if(!athlete)return false;
 if(actor.role==="ADMIN")return true;
 const now=new Date();
 return Boolean(await prisma.coachAssignment.findFirst({where:{
  coachId:actor.id,athleteId,active:true,startsAt:{lte:now},OR:[{endsAt:null},{endsAt:{gt:now}}]
 },select:{id:true}}));
}
