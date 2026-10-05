import {prisma} from "./db";
export async function canCoachAccess(coach:{id:string;role:string},athleteId:string){
  if(coach.role==="ADMIN")return true;
  if(coach.role!=="COACH")return false;
  return Boolean(await prisma.coachAssignment.findFirst({where:{coachId:coach.id,athleteId,active:true}}));
}
export async function coachAthleteFilter(coach:{id:string;role:string}){
  if(coach.role==="ADMIN")return {};
  const items=await prisma.coachAssignment.findMany({where:{coachId:coach.id,active:true},select:{athleteId:true}});
  return {userId:{in:items.map(x=>x.athleteId)}};
}
