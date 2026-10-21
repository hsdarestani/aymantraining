import {Prisma} from "@prisma/client";
import {prisma} from "./db";
import {
 curriculumDraftSchema,journeyPathwayCreateSchema,validatePublishableDraft,emptyCurriculum,
 type CurriculumDraft
} from "./journey-editor-contract";
import {JOURNEY_LEVELS} from "./journey-contract";
import {JOURNEY_ONBOARDING_GOALS} from "./journey-onboarding";

type Tx=Prisma.TransactionClient;
function unchanged(code:string):never{throw new Error(code);}
const same=(a:string[],b:string[])=>a.length===b.length&&a.every((x,i)=>x===b[i]);

async function requireCoach(actorId:string){
  const actor=await prisma.user.findUnique({where:{id:actorId},select:{role:true}});
  if(actor?.role!=="ADMIN"&&actor?.role!=="COACH")unchanged("UNAUTHORIZED");
}

async function loadVersion(tx:Tx,versionId:string){
 return tx.journeyPathwayVersion.findUnique({
  where:{id:versionId},
  include:{
   pathway:true,
   levels:{orderBy:{position:"asc"},include:{
    chapters:{orderBy:{position:"asc"},include:{
     items:{orderBy:{position:"asc"},include:{media:{include:{media:true}}}},
     assessments:{where:{kind:"CHAPTER_FINAL"}}
    }}
   }},
   assessments:{where:{kind:"PLACEMENT"}}
  }
 });
}
function snapshot(v:NonNullable<Awaited<ReturnType<typeof loadVersion>>>){
 return {
  id:v.id,pathwayId:v.pathwayId,version:v.version,state:v.state,
  revision:v.updatedAt.toISOString(),notes:v.notes||"",publishedAt:v.publishedAt,
  titleDe:v.pathway.titleDe,description:v.pathway.description||"",goalSlugs:v.goalSlugs,
  levels:v.levels.map(l=>({code:l.code,description:l.description||"",chapters:l.chapters.map(c=>({
   titleDe:c.titleDe,description:c.description||"",plannedDurationDays:c.plannedDurationDays,
   items:c.items.map(i=>({
    kind:i.kind,titleDe:i.titleDe||"",description:i.description||"",
    exerciseId:i.exerciseId,trainingPlanId:i.trainingPlanId,mandatory:i.mandatory,
    media:i.media.map(m=>({role:m.role,presenter:m.presenter,mediaAssetId:m.mediaAssetId,durationSec:m.durationSec}))
   })),
   test:c.assessments[0]?{
    titleDe:c.assessments[0].titleDe,criteria:c.assessments[0].criteria,
    retestRules:c.assessments[0].retestRules,approved:Boolean(c.assessments[0].approvedAt)
   }:null
  }))})),
  placement:v.assessments[0]?{
   titleDe:v.assessments[0].titleDe,criteria:v.assessments[0].criteria,
   retestRules:v.assessments[0].retestRules,approved:Boolean(v.assessments[0].approvedAt)
  }:null
 };
}

export async function listCoachJourneys(actorId:string){
 await requireCoach(actorId);
 const [paths,pending]=await Promise.all([
  prisma.journeyPathway.findMany({
   include:{versions:{select:{id:true,version:true,state:true,updatedAt:true,publishedAt:true},
      orderBy:{version:"desc"}},goals:{include:{goal:true}}},
   orderBy:{updatedAt:"desc"},take:150
  }),
  prisma.journeyIntake.findMany({where:{status:"PENDING_PATHWAY"},
   select:{selectedGoalSlugs:true}})
 ]);
 return {paths:paths.map(p=>({...p,goals:p.goals.map(g=>g.goal.slug)})),
  waiting:pending.length,goals:JOURNEY_ONBOARDING_GOALS};
}

export async function createCoachJourney(actorId:string,input:unknown){
 await requireCoach(actorId);
 const parsed=journeyPathwayCreateSchema.parse(input);
 const goals=[...parsed.goals].sort();
 // An exact goal combination is curated once, not duplicated as competing paths.
 const existing=await prisma.journeyPathwayVersion.findMany({
  where:{goalSlugs:{hasEvery:goals}},select:{id:true,goalSlugs:true}
 });
 if(existing.some(v=>same([...v.goalSlugs].sort(),goals)))unchanged("DUPLICATE_COMBINATION");
 return prisma.$transaction(async tx=>{
  for(const g of JOURNEY_ONBOARDING_GOALS)await tx.journeyGoal.upsert({
   where:{slug:g.slug},create:{slug:g.slug,titleDe:g.label,active:true},update:{titleDe:g.label}
  });
  const path=await tx.journeyPathway.create({data:{
   slug:"journey_"+crypto.randomUUID().replaceAll("-",""),
   titleDe:parsed.titleDe,description:parsed.description,
   goals:{create:goals.map(goalSlug=>({goal:{connect:{slug:goalSlug}}}))}
  }});
  const version=await tx.journeyPathwayVersion.create({data:{
   pathwayId:path.id,version:1,goalSlugs:goals,state:"DRAFT",
   levels:{create:emptyCurriculum().map((l,i)=>({
    code:l.code,labelDe:l.code.replaceAll("_"," "),description:l.description,position:i+1
   }))}
  }});
  return {id:path.id,versionId:version.id};
 });
}
async function validateMedia(tx:Tx,actorId:string,draft:CurriculumDraft){
 const refs=draft.levels.flatMap(l=>l.chapters.flatMap(c=>c.items.flatMap(i=>i.media)));
 const ids=[...new Set(refs.map(x=>x.mediaAssetId))];
 if(!ids.length)return;
 const assets=await tx.mediaAsset.findMany({where:{id:{in:ids}},
  select:{id:true,kind:true,relatedUserId:true,ownerId:true,storageKey:true}});
 if(assets.length!==ids.length)unchanged("INVALID_MEDIA");
 const actor=await tx.user.findUnique({where:{id:actorId},select:{role:true}});
 for(const ref of refs){
  const asset=assets.find(x=>x.id===ref.mediaAssetId)!;
  const isVideo=ref.role==="EXPLANATION_VIDEO";
  if(!asset.storageKey.startsWith("journey-media/"))unchanged("PRIVATE_MEDIA");
  if(asset.kind!==(isVideo?"EXERCISE_VIDEO":"EXERCISE_IMAGE"))
   unchanged("INVALID_MEDIA_KIND");
  // These items are approved exercise reference assets, never athlete progress files.
  if(asset.relatedUserId&&asset.relatedUserId!==asset.ownerId)unchanged("PRIVATE_MEDIA");
  if(actor?.role!=="ADMIN"&&asset.ownerId!==actorId){
   const owner=await tx.user.findUnique({where:{id:asset.ownerId},select:{role:true}});
   if(owner?.role!=="COACH"&&owner?.role!=="ADMIN")unchanged("PRIVATE_MEDIA");
  }
 }
}
async function validateLegacyLinks(tx:Tx,draft:CurriculumDraft){
 const items=draft.levels.flatMap(l=>l.chapters.flatMap(c=>c.items));
 const ex=[...new Set(items.filter(x=>x.kind==="EXERCISE").map(x=>x.exerciseId!))];
 const plans=[...new Set(items.filter(x=>x.kind==="TRAINING_PLAN").map(x=>x.trainingPlanId!))];
 if(ex.length){
  const count=await tx.exercise.count({where:{id:{in:ex},active:true}});
  if(count!==ex.length)unchanged("INVALID_EXERCISE");
 }
 if(plans.length){
  const count=await tx.trainingPlan.count({where:{id:{in:plans},active:true}});
  if(count!==plans.length)unchanged("INVALID_PLAN");
 }
}
function assessmentData(a:NonNullable<CurriculumDraft["placement"]>){
 return {
  titleDe:a.titleDe,criteria:a.criteria as Prisma.InputJsonValue,
  retestRules:a.retestRules?a.retestRules as Prisma.InputJsonValue:Prisma.JsonNull,
  approvedAt:a.approved?new Date():null
 };
}
async function eraseDraftGraph(tx:Tx,versionId:string){
 const chapterWhere={chapter:{level:{versionId}}};
 await tx.chapterMediaVariant.deleteMany({where:{item:chapterWhere}});
 await tx.journeyActivityCompletion.deleteMany({where:{item:chapterWhere}}); // drafts must have no enrollments; defensive
 await tx.journeyChapterItem.deleteMany({where:chapterWhere});
 await tx.journeyAssessment.deleteMany({where:{versionId}});
 await tx.journeyChapter.deleteMany({where:{level:{versionId}}});
 await tx.journeyLevelDefinition.deleteMany({where:{versionId}});
}
async function writeDraftGraph(tx:Tx,versionId:string,draft:Omit<CurriculumDraft,"revision">){
 for(let li=0;li<draft.levels.length;li++){
  const l=draft.levels[li];
  const level=await tx.journeyLevelDefinition.create({data:{
   versionId,code:l.code,labelDe:l.code.replaceAll("_"," "),description:l.description,position:li+1
  }});
  for(let ci=0;ci<l.chapters.length;ci++){
   const c=l.chapters[ci];
   const chapter=await tx.journeyChapter.create({data:{
    levelId:level.id,position:ci+1,titleDe:c.titleDe,description:c.description,
    plannedDurationDays:c.plannedDurationDays
   }});
   for(let ii=0;ii<c.items.length;ii++){
    const it=c.items[ii];
    await tx.journeyChapterItem.create({data:{
     chapterId:chapter.id,position:ii+1,kind:it.kind,
     titleDe:it.titleDe,description:it.description,mandatory:it.mandatory,
     exerciseId:it.kind==="EXERCISE"?it.exerciseId:null,
     trainingPlanId:it.kind==="TRAINING_PLAN"?it.trainingPlanId:null,
     media:{create:it.media.map(m=>({
      mediaAssetId:m.mediaAssetId,role:m.role,presenter:m.presenter,
      minTier:m.role==="EXPLANATION_VIDEO"?"PRO":"FREE",durationSec:m.durationSec??null
     }))}
    }});
   }
   if(c.test)await tx.journeyAssessment.create({data:{
    versionId,chapterId:chapter.id,kind:"CHAPTER_FINAL",...assessmentData(c.test)
   }});
  }
 }
 if(draft.placement)await tx.journeyAssessment.create({data:{
  versionId,kind:"PLACEMENT",...assessmentData(draft.placement)
 }});
}
export async function getCoachJourneyVersion(actorId:string,versionId:string){
 await requireCoach(actorId);
 const row=await loadVersion(prisma,versionId);
 if(!row)throw new Error("NOT_FOUND");
 const [exercises,plans]=await Promise.all([
  prisma.exercise.findMany({where:{active:true},select:{id:true,nameDe:true,category:true},
   orderBy:{nameDe:"asc"},take:500}),
  prisma.trainingPlan.findMany({where:{active:true},select:{id:true,name:true},
   orderBy:{name:"asc"},take:250})
 ]);
 return {...snapshot(row),exercises,plans};
}
export async function saveCoachJourneyDraft(actorId:string,versionId:string,input:unknown){
 await requireCoach(actorId);
 const draft=curriculumDraftSchema.parse(input);
 return prisma.$transaction(async tx=>{
  const version=await tx.journeyPathwayVersion.findUnique({
   where:{id:versionId},select:{id:true,state:true,updatedAt:true}
  });
  if(!version)throw new Error("NOT_FOUND");
  if(version.state!=="DRAFT")unchanged("PUBLISHED_IMMUTABLE");
  if(version.updatedAt.toISOString()!==draft.revision)unchanged("REVISION_CONFLICT");
  if(await tx.journeyEnrollment.count({where:{versionId}}))unchanged("ENROLLED_IMMUTABLE");
  await validateLegacyLinks(tx,draft);
  await validateMedia(tx,actorId,draft);
  const claimed=await tx.journeyPathwayVersion.updateMany({
   where:{id:versionId,state:"DRAFT",updatedAt:version.updatedAt},
   data:{notes:draft.notes,updatedAt:new Date(Date.now()+20)}
  });
  if(claimed.count!==1)unchanged("REVISION_CONFLICT");
  await eraseDraftGraph(tx,versionId);
  await writeDraftGraph(tx,versionId,draft);
  const fresh=await tx.journeyPathwayVersion.findUniqueOrThrow({
   where:{id:versionId},select:{updatedAt:true}
  });
  return {revision:fresh.updatedAt.toISOString()};
 });
}
export async function cloneCoachJourneyVersion(actorId:string,pathwayId:string){
 await requireCoach(actorId);
 return prisma.$transaction(async tx=>{
  const versions=await tx.journeyPathwayVersion.findMany({
   where:{pathwayId},orderBy:{version:"desc"},select:{id:true,version:true,state:true}
  });
  if(!versions.length)unchanged("NOT_FOUND");
  if(versions.some(v=>v.state==="DRAFT"))unchanged("DRAFT_ALREADY_EXISTS");
  const source=await loadVersion(tx,versions[0].id);
  if(!source)throw new Error("NOT_PUBLISHED");
  if(source.state!=="PUBLISHED")unchanged("NOT_PUBLISHED");
  const data=snapshot(source);
  const parsed=curriculumDraftSchema.parse({
   revision:data.revision,notes:data.notes,
   levels:data.levels,placement:data.placement
  });
  const newVersion=await tx.journeyPathwayVersion.create({data:{
   pathwayId,version:versions[0].version+1,state:"DRAFT",
   notes:source.notes,goalSlugs:[...source.goalSlugs]
  }});
  await writeDraftGraph(tx,newVersion.id,parsed);
  return {id:newVersion.id,version:newVersion.version};
 });
}
export async function publishCoachJourneyVersion(actorId:string,versionId:string){
 await requireCoach(actorId);
 return prisma.$transaction(async tx=>{
  const row=await loadVersion(tx,versionId);
  if(!row)throw new Error("NOT_FOUND");
  if(row.state!=="DRAFT")unchanged("PUBLISHED_IMMUTABLE");
  const raw=snapshot(row);
  const parsed=curriculumDraftSchema.parse({
   revision:raw.revision,notes:raw.notes,levels:raw.levels,placement:raw.placement
  });
  const missing=validatePublishableDraft(parsed);
  if(missing.length)unchanged("INCOMPLETE:"+missing.slice(0,12).join(" | "));
  if(await tx.journeyEnrollment.count({where:{versionId}}))unchanged("ENROLLED_IMMUTABLE");
  // A pending intake is matched by exact canonical goal set, never by any subset.
  const selected=[...row.goalSlugs].sort();
  if(!selected.length)unchanged("MISSING_GOALS");
  const claim=await tx.journeyPathwayVersion.updateMany({where:{
   id:row.id,state:"DRAFT",updatedAt:row.updatedAt
  },data:{state:"PUBLISHED",publishedAt:new Date()}});
  if(claim.count!==1)unchanged("REVISION_CONFLICT");
  const intake=await tx.journeyIntake.findMany({where:{status:"PENDING_PATHWAY"}});
  let mapped=0;
  for(const waiting of intake){
   if(!same([...waiting.selectedGoalSlugs].sort(),selected))continue;
   await tx.journeyEnrollment.upsert({
    where:{userId_versionId:{userId:waiting.userId,versionId:row.id}},
    create:{userId:waiting.userId,versionId:row.id,selfLevel:waiting.selfLevel,state:"PENDING"},
    update:{}
   });
   await tx.journeyIntake.updateMany({where:{id:waiting.id,status:"PENDING_PATHWAY"},
    data:{status:"PENDING_PLACEMENT",matchedVersionId:row.id}});
   mapped++;
  }
  return {versionId:row.id,publishedAt:new Date(),matchedIntakes:mapped};
 });
}
