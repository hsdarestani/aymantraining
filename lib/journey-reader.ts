import {Prisma} from "@prisma/client";
import {prisma} from "./db";
import {JOURNEY_LEVEL_DESCRIPTIONS,JOURNEY_ONBOARDING_GOALS} from "./journey-onboarding";
import {canOpenJourneyMedia,normalizeGoalSlugs} from "./journey-contract";

export const JOURNEY_LEVEL_LABELS=JOURNEY_LEVEL_DESCRIPTIONS;
type Tx=Prisma.TransactionClient;

/** A PREVIEW intentionally excludes chapter instructions, media and exam criteria. */
export async function getJourneyOverview(userId:string){
 const [enrollments,intake,oldGoals,workouts]=await Promise.all([
  prisma.journeyEnrollment.findMany({
   where:{userId,version:{state:"PUBLISHED"}},
   include:{
    version:{include:{pathway:{select:{titleDe:true}},levels:{orderBy:{position:"asc"},include:{
     chapters:{orderBy:{position:"asc"},select:{
      id:true,titleDe:true,position:true,plannedDurationDays:true,
      items:{select:{id:true,mandatory:true}}
     }}
    }}}},
    unlocks:{select:{chapterId:true}},
    completions:{select:{chapterId:true}},
    activities:{select:{itemId:true}},
    awards:{select:{levelId:true}}
   },orderBy:{startedAt:"desc"},take:10
  }),
  prisma.journeyIntake.findUnique({where:{userId},select:{
   selectedGoalSlugs:true,selfLevel:true,status:true,dashboard:true,matchedVersionId:true
  }}),
  prisma.goal.findMany({where:{userId,active:true},select:{type:true},take:20}),
  prisma.workout.count({where:{userId}})
 ]);
 const levelDescriptions=new Map(JOURNEY_LEVEL_DESCRIPTIONS.map(l=>[l.code,l.description]));
 return {
  goals:JOURNEY_ONBOARDING_GOALS,
  levels:JOURNEY_LEVEL_DESCRIPTIONS,
  testsEnabled:process.env.JOURNEY_TESTS_ENABLED==="true",
  intake:intake?{
   goals:intake.selectedGoalSlugs,status:intake.status,
   selfLevel:intake.selfLevel,dashboard:intake.dashboard
  }:null,
  legacy:{activeGoals:oldGoals.map(g=>g.type),workoutCount:workouts,
   transitionAvailable:!intake&&enrollments.length===0},
  enrollments:enrollments.map(e=>{
   const unlocked=new Set(e.unlocks.map(u=>u.chapterId));
   const done=new Set(e.completions.map(c=>c.chapterId));
   const activity=new Set(e.activities.map(a=>a.itemId));
   const awards=new Set(e.awards.map(a=>a.levelId));
   const levels=e.version.levels.map(l=>({
    code:l.code,description:l.description||levelDescriptions.get(l.code)||"",
    earned:awards.has(l.id),
    chapters:l.chapters.map(c=>{
     const accessible=unlocked.has(c.id)&&["ACTIVE","FINISHED"].includes(e.state);
     const mandatory=c.items.filter(i=>i.mandatory);
     const completed=accessible?mandatory.filter(i=>activity.has(i.id)).length:0;
     return {
      id:c.id,titleDe:c.titleDe,position:c.position,unlocked:accessible,
      finished:done.has(c.id)&&accessible,
      // No private lesson data from locked chapters, including progress counts.
      mandatoryDone:accessible?completed:null,
      mandatoryTotal:accessible?mandatory.length:null,
      plannedDurationDays:accessible?c.plannedDurationDays:null
     };
    })
   }));
   const flat=levels.flatMap(l=>l.chapters);
   return {
    id:e.id,pathway:e.version.pathway.titleDe,version:e.version.version,
    state:e.state,selfLevel:e.selfLevel,confirmedLevel:e.confirmedLevel,
    levels,completedChapters:flat.filter(c=>c.finished).length,
    totalChapters:flat.length,earnedLevels:levels.filter(l=>l.earned).map(l=>l.code),
    nextChapterId:flat.find(c=>c.unlocked&&!c.finished)?.id??null
   };
  })
 };
}

/** Explicit, consent-based invitation for existing athletes: old data stays untouched. */
export async function optInLegacyJourney(userId:string,goals:string[],selfLevel:
 "READY"|"AWAKE"|"DIFFERENT"|"BE_DIFFERENT"|"TRULY_DIFFERENT"){
 const normalized=normalizeGoalSlugs(goals);
 if(!normalized.length||normalized.length>6)throw new Error("INVALID_GOALS");
 return prisma.$transaction(async(tx:Tx)=>{
  const user=await tx.user.findUnique({where:{id:userId},select:{id:true,role:true,onboardingCompleted:true}});
  if(!user||user.role!=="ATHLETE"||!user.onboardingCompleted)throw new Error("NOT_ELIGIBLE");
  const existing=await tx.journeyIntake.findUnique({where:{userId},select:{id:true}});
  const enrollments=await tx.journeyEnrollment.count({where:{userId}});
  if(existing||enrollments)throw new Error("ALREADY_REQUESTED");
  const versions=await tx.journeyPathwayVersion.findMany({
   where:{state:"PUBLISHED",pathway:{active:true},goalSlugs:{hasEvery:normalized}},
   select:{id:true,goalSlugs:true},orderBy:[{publishedAt:"desc"},{version:"desc"}]
  });
  const matched=versions.find(v=>v.goalSlugs.length===normalized.length)??null;
  const state=matched?"PENDING_PLACEMENT":"PENDING_PATHWAY";
  await tx.journeyIntake.create({data:{
   userId,selectedGoalSlugs:normalized,selfLevel,status:state,
   matchedVersionId:matched?.id??null
  }});
  if(matched)await tx.journeyEnrollment.create({data:{
   userId,versionId:matched.id,selfLevel,state:"PENDING"
  }});
  return {status:state,matchedVersionId:matched?.id??null,
   confirmedLevel:null,legacyPreserved:true};
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}

export async function getOwnedJourneyChapter(userId:string,enrollmentId:string,chapterId:string){
 const enrollment=await prisma.journeyEnrollment.findFirst({
  where:{id:enrollmentId,userId,state:{in:["ACTIVE","FINISHED"]},version:{state:"PUBLISHED"}},
  select:{id:true,versionId:true,user:{select:{subscriptionTier:true}}}
 });
 if(!enrollment)throw new Error("NOT_FOUND");
 const grant=await prisma.journeyChapterUnlock.findUnique({where:{
  enrollmentId_chapterId:{enrollmentId,chapterId}
 },select:{id:true}});
 if(!grant)throw new Error("LOCKED");
 const chapter=await prisma.journeyChapter.findFirst({
  where:{id:chapterId,level:{versionId:enrollment.versionId}},
  include:{
   level:{select:{code:true}},
   items:{orderBy:{position:"asc"},include:{
    exercise:{select:{nameDe:true,category:true,equipment:true,coachCue1:true,coachCue2:true,coachCue3:true}},
    trainingPlan:{select:{name:true,description:true}},
    media:{select:{id:true,role:true,presenter:true,minTier:true,
     media:{select:{id:true,kind:true,storageKey:true}}
    }}
   }},
   assessments:{where:{kind:"CHAPTER_FINAL",approvedAt:{not:null}},select:{id:true,titleDe:true}}
  }
 });
 if(!chapter)throw new Error("NOT_FOUND");
 const [activities,completion]=await Promise.all([
  prisma.journeyActivityCompletion.findMany({
   where:{enrollmentId,itemId:{in:chapter.items.map(i=>i.id)}},select:{itemId:true}
  }),
  prisma.journeyChapterCompletion.findUnique({where:{
   enrollmentId_chapterId:{enrollmentId,chapterId}
  },select:{completedAt:true}})
 ]);
 const done=new Set(activities.map(a=>a.itemId));
 const tier=enrollment.user.subscriptionTier;
 return {
  id:chapter.id,enrollmentId,level:chapter.level.code,
  titleDe:chapter.titleDe,description:chapter.description||"",
  plannedDurationDays:chapter.plannedDurationDays,
  finished:Boolean(completion),
  mandatoryTotal:chapter.items.filter(i=>i.mandatory).length,
  mandatoryDone:chapter.items.filter(i=>i.mandatory&&done.has(i.id)).length,
  test:chapter.assessments[0]?{id:chapter.assessments[0].id,titleDe:chapter.assessments[0].titleDe}:null,
  items:chapter.items.map(i=>{
   // Never read mutable Exercise/TrainingPlan data for an already published Journey.
   const snap=i.publishedSnapshot&&typeof i.publishedSnapshot==="object"&&!Array.isArray(i.publishedSnapshot)?
     i.publishedSnapshot as Record<string,unknown>:null;
   const frozen=snap?.schemaVersion===1?snap:null;
   const exercise=frozen?.exercise&&typeof frozen.exercise==="object"?frozen.exercise:null;
   const trainingPlan=frozen?.trainingPlan&&typeof frozen.trainingPlan==="object"?frozen.trainingPlan:null;
   return {
   id:i.id,kind:i.kind,titleDe:i.titleDe||"",description:i.description||"",
   mandatory:i.mandatory,done:done.has(i.id),
   exercise:exercise??null,
   trainingPlan:trainingPlan??null,
   media:i.media.map(m=>{
    const isVideo=m.role==="EXPLANATION_VIDEO";
    const eligible=canOpenJourneyMedia({earnedChapter:true,tier,minTier:m.minTier})&&
     (!isVideo||m.minTier!=="FREE");
    const deliver=eligible&&process.env.JOURNEY_EDITOR_ENABLED==="true"&&
     m.media.storageKey.startsWith("journey-media/")&&
     m.media.kind===(isVideo?"EXERCISE_VIDEO":"EXERCISE_IMAGE");
    return {
     role:m.role,presenter:m.presenter,proOnly:m.minTier!=="FREE",
     // Never return media ids or storage paths for locked entitlement.
     available:deliver,url:deliver?"/api/media/"+encodeURIComponent(m.media.id):null
    };
   })
  };
  })
 };
}
