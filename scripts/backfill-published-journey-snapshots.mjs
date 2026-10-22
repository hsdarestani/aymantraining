import {PrismaClient} from "@prisma/client";
const db=new PrismaClient();
try{
  const versions=await db.journeyPathwayVersion.findMany({
    where:{state:"PUBLISHED"},select:{id:true}
  });
  let filled=0;
  for(const version of versions){
    const items=await db.journeyChapterItem.findMany({
      where:{chapter:{level:{versionId:version.id}},publishedSnapshot:{equals:null}},
      include:{exercise:true,trainingPlan:{include:{items:{include:{exercise:true},orderBy:[{dayIndex:"asc"},{orderIndex:"asc"}]}}}}
    });
    for(const item of items){
      const exercise=item.exercise?{
        nameDe:item.exercise.nameDe,category:item.exercise.category,equipment:item.exercise.equipment,
        coachTips:[item.exercise.coachCue1,item.exercise.coachCue2,item.exercise.coachCue3].filter(Boolean),
        imageStart:item.exercise.imageStart,imageMiddle:item.exercise.imageMiddle,imageEnd:item.exercise.imageEnd
      }:null;
      const trainingPlan=item.trainingPlan?{
        name:item.trainingPlan.name,description:item.trainingPlan.description,
        items:item.trainingPlan.items.map(p=>({
          dayIndex:p.dayIndex,orderIndex:p.orderIndex,targetSets:p.targetSets,targetReps:p.targetReps,
          targetRpe:p.targetRpe,restSeconds:p.restSeconds,notes:p.notes,
          exercise:{nameDe:p.exercise.nameDe,equipment:p.exercise.equipment}
        }))
      }:null;
      const updated=await db.journeyChapterItem.updateMany({
        where:{id:item.id,publishedSnapshot:{equals:null}},
        data:{publishedSnapshot:{schemaVersion:1,exercise,trainingPlan}}
      });
      filled+=updated.count;
    }
  }
  console.log("JOURNEY_PUBLISHED_SNAPSHOT_BACKFILL",{versions:versions.length,filled});
}finally{await db.$disconnect()}
