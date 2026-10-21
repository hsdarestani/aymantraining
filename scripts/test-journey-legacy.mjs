import assert from "node:assert/strict";
import {PrismaClient} from "@prisma/client";
if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Legacy migration verification requires disposable bedifferent_test database.");
const db=new PrismaClient();
try{
  if(process.argv[2]==="seed"){
    const user=await db.user.create({data:{
      email:"step03-legacy-preservation@example.invalid",passwordHash:"test-only",name:"Vorheriger Nutzer",role:"ATHLETE",
      onboardingCompleted:true,subscriptionTier:"PRO",trainingExperience:"REGULAR"
    }});
    const goal=await db.goal.create({data:{userId:user.id,type:"muscle_building"}});
    const plan=await db.trainingPlan.create({data:{name:"Vorhandener Plan",isTemplate:true,active:true}});
    await db.planAssignment.create({data:{userId:user.id,planId:plan.id}});
    const workout=await db.workout.create({data:{userId:user.id,trainingPlanId:plan.id,title:"Altes Workout",completedAt:new Date("2026-10-19T09:00:00Z")}});
    await db.performanceTest.create({data:{userId:user.id,name:"Alte Messung",completedAt:new Date("2026-10-18T10:00:00Z"),
      results:{create:[{metric:"pushups",value:12,unit:"reps"}]}}});
    const snap=await db.scoreSnapshot.create({data:{userId:user.id,date:new Date("2026-10-19T00:00:00Z"),total:35,strength:50}});
    await db.badge.create({data:{userId:user.id,key:"old_badge",name:"Keep It"}});
    await db.consentRecord.create({data:{userId:user.id,type:"privacy",version:"1.0",granted:true}});
    console.log("LEGACY_SEEDED "+JSON.stringify({user:user.id,goal:goal.id,workout:workout.id,score:snap.id}));
  }else if(process.argv[2]==="verify"){
    const u=await db.user.findUnique({where:{email:"step03-legacy-preservation@example.invalid"},include:{
      goals:true,assignments:{include:{plan:true}},workouts:true,scoreSnapshots:true,consents:true
    }});
    assert(u,"previous user must still exist");
    assert.equal(u.subscriptionTier,"PRO");
    assert.equal(u.onboardingCompleted,true);
    assert.equal(u.goals[0]?.type,"muscle_building");
    assert.equal(u.assignments[0]?.plan.name,"Vorhandener Plan");
    assert.equal(u.workouts[0]?.title,"Altes Workout");
    assert.equal(u.scoreSnapshots[0]?.total,35);
    assert.equal(u.consents[0]?.granted,true);
    assert.equal(await db.performanceTest.count({where:{userId:u.id}}),1);
    assert.equal(await db.badge.count({where:{userId:u.id,key:"old_badge"}}),1);
    assert.equal(await db.journeyEnrollment.count({where:{userId:u.id}}),0);
    console.log("LEGACY_PRESERVED_OK");
  }else throw Error("expected seed or verify argument");
}finally{
  await db.$disconnect();
}
