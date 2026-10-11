import {PrismaClient} from "@prisma/client";
const db=new PrismaClient();
const email="admin@bedifferent.smarbiz.sbs";
async function main(){
 const user=await db.user.findUnique({where:{email}});
 if(!user||user.role!=="ADMIN")throw new Error("Expected existing administrator missing");
 const plan=await db.trainingPlan.findUnique({where:{id:"starter-athlete-base"},include:{items:true}});
 if(!plan)throw new Error("Original starter training template missing");
 await db.$transaction(async tx=>{
   await tx.user.update({where:{id:user.id},data:{name:"Ayman",onboardingCompleted:true}});
   const active=await tx.planAssignment.count({where:{userId:user.id,active:true}});
   if(active===0)await tx.planAssignment.create({data:{userId:user.id,planId:plan.id,active:true}});
   const existing=await tx.workout.count({where:{userId:user.id}});
   if(existing===0){
     const days=[...new Set(plan.items.map(x=>x.dayIndex))].sort((a,b)=>a-b).slice(0,3);
     for(const dayIndex of days){
       const scheduledAt=new Date(Date.parse("2026-10-12T16:00:00Z")+dayIndex*86400000);
       await tx.workout.create({data:{
         userId:user.id,trainingPlanId:plan.id,title:"ATHLETEN BASIS 01 · Vorlage",
         scheduledAt,notes:"Rekonstruierte Startervorlage, keine bestätigte historische Leistung",
         exercises:{create:plan.items.filter(x=>x.dayIndex===dayIndex).map(x=>({
           exerciseId:x.exerciseId,orderIndex:x.orderIndex,targetSets:x.targetSets,
           targetReps:x.targetReps,targetRpe:x.targetRpe,restSeconds:x.restSeconds
         }))}
       }});
     }
   }
 });
 console.log("PROFILE_NAME_UPDATED=Ayman");
 console.log("ADMIN_ROLE_PRESERVED=YES");
 console.log("STARTER_PLAN_ASSIGNED=YES");
 console.log("TRAINING_TEMPLATE_SCHEDULED_IF_EMPTY=YES");
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>db.$disconnect());
