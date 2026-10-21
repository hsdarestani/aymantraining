import {Prisma, JourneyLevel, JourneyAssessmentKind, JourneyUnlockReason, JourneyVerdict} from "@prisma/client";
import {prisma} from "./db";
import {
  assessJourneyResults,canOpenJourneyMedia,JOURNEY_LEVELS,
  journeyCriteriaSchema,journeyResultsSchema,journeyRetestSchema,normalizeGoalSlugs,
  type JourneyResults
} from "./journey-contract";

type Tx=Prisma.TransactionClient;
type PlacementReason="PLACEMENT_TEST"|"COACH_APPROVAL"|"LEGACY_REVIEW";
function refuse(message:string):never{throw new Error(message);}

async function requireAssignedCoach(tx:Tx,coachId:string,athleteId:string){
  const coach=await tx.user.findUnique({where:{id:coachId},select:{role:true}});
  if(coach?.role==="ADMIN")return;
  if(coach?.role!=="COACH")refuse("Eine Trainerfreigabe ist erforderlich.");
  const assigned=await tx.coachAssignment.findFirst({
    where:{coachId,athleteId,active:true,OR:[{endsAt:null},{endsAt:{gt:new Date()}}]},
    select:{id:true}
  });
  if(!assigned)refuse("Dieser Coach ist für den Athleten nicht zuständig.");
}

/** An exact curated combination is required. Never stitch arbitrary unrelated plans together. */
export async function findCuratedJourney(goalSlugs:string[]){
  const selected=normalizeGoalSlugs(goalSlugs);
  const versions=await prisma.journeyPathwayVersion.findMany({
    where:{state:"PUBLISHED",pathway:{active:true}},
    include:{pathway:{include:{goals:{include:{goal:true}}}}},
    orderBy:[{publishedAt:"desc"},{version:"desc"}]
  });
  return versions.find(v=>{
    const candidate=v.pathway.goals.map(g=>g.goal.slug).sort();
    return candidate.length===selected.length&&candidate.every((g,i)=>g===selected[i]);
  })??null;
}

/** Self-estimate never grants a level or a chapter. */
export async function enrollInJourney(userId:string,versionId:string,selfLevel:JourneyLevel){
  const version=await prisma.journeyPathwayVersion.findUnique({where:{id:versionId},include:{pathway:true}});
  if(!version||version.state!=="PUBLISHED"||!version.pathway.active)refuse("Trainingsweg ist nicht veröffentlicht.");
  if(!JOURNEY_LEVELS.includes(selfLevel))refuse("Ungültiges Einstiegslevel.");
  return prisma.journeyEnrollment.upsert({
    where:{userId_versionId:{userId,versionId}},
    create:{userId,versionId,selfLevel,state:"PENDING"},
    update:{} // Never reset existing approvals/progress from repeated onboarding calls.
  });
}

export async function confirmJourneyPlacement(args:{
  enrollmentId:string;level:JourneyLevel;approvedById:string;reason:PlacementReason;passedPlacementAttemptId?:string
}){
  return prisma.$transaction(async tx=>{
    const enrollment=await tx.journeyEnrollment.findUnique({where:{id:args.enrollmentId},
      include:{version:{include:{levels:{include:{chapters:{orderBy:{position:"asc"}}}}}}}});
    if(!enrollment||enrollment.state!=="PENDING"||enrollment.confirmedAt)refuse("Einstufung bereits abgeschlossen oder nicht vorhanden.");
    if(enrollment.version.state!=="PUBLISHED")refuse("Dieser Weg nimmt aktuell keine Einstufungen an.");
    await requireAssignedCoach(tx,args.approvedById,enrollment.userId);
    const target=enrollment.version.levels.find(l=>l.code===args.level);
    if(!target||target.chapters.length===0)refuse("Kein freigegebenes Anfangskapitel für dieses Level.");
    if(args.reason==="PLACEMENT_TEST"){
      const attempt=await tx.journeyTestAttempt.findFirst({where:{
        id:args.passedPlacementAttemptId??"__none__",enrollmentId:enrollment.id,verdict:"PASSED",
        assessment:{versionId:enrollment.versionId,kind:"PLACEMENT",approvedAt:{not:null}}
      }});
      if(!attempt)refuse("Bestandener bestätigter Einstufungstest erforderlich.");
    }
    const claimed=await tx.journeyEnrollment.updateMany({
      where:{id:enrollment.id,state:"PENDING",confirmedAt:null},
      data:{state:"ACTIVE",confirmedLevel:args.level,confirmedAt:new Date()}
    });
    if(claimed.count!==1)refuse("Einstufung wurde bereits bearbeitet.");
    await tx.journeyLevelAward.create({data:{
      enrollmentId:enrollment.id,levelId:target.id,reason:args.reason as JourneyUnlockReason,
      attemptId:args.passedPlacementAttemptId??null
    }});
    await tx.journeyChapterUnlock.create({data:{
      enrollmentId:enrollment.id,chapterId:target.chapters[0].id,
      reason:args.reason as JourneyUnlockReason,attemptId:args.passedPlacementAttemptId??null,grantedById:args.approvedById
    }});
    return {enrollmentId:enrollment.id,confirmedLevel:args.level,firstChapterId:target.chapters[0].id};
  });
}

/** Only earned items can be marked completed. Idempotent and owned by the athlete. */
export async function markJourneyItemComplete(userId:string,enrollmentId:string,itemId:string){
  return prisma.$transaction(async tx=>{
    const enrollment=await tx.journeyEnrollment.findUnique({where:{id:enrollmentId},select:{userId:true,versionId:true,state:true}});
    if(!enrollment||enrollment.userId!==userId||enrollment.state!=="ACTIVE")refuse("Aktive eigene Teilnahme erforderlich.");
    const item=await tx.journeyChapterItem.findUnique({where:{id:itemId},
      select:{chapterId:true,chapter:{select:{level:{select:{versionId:true}}}}}});
    if(!item||item.chapter.level.versionId!==enrollment.versionId)refuse("Kapitelinhalt gehört nicht zu diesem Weg.");
    const allowed=await tx.journeyChapterUnlock.findUnique({
      where:{enrollmentId_chapterId:{enrollmentId,chapterId:item.chapterId}},select:{id:true}
    });
    if(!allowed)refuse("Kapitel noch gesperrt.");
    return tx.journeyActivityCompletion.upsert({
      where:{enrollmentId_itemId:{enrollmentId,itemId}},create:{enrollmentId,itemId},update:{}
    });
  });
}

/** Scores never enter this process; all results start as PENDING for coach review. */
export async function submitJourneyAssessment(args:{
  userId:string;enrollmentId:string;assessmentId:string;results:JourneyResults;idempotencyKey:string
}){
  const parsed=journeyResultsSchema.parse(args.results);
  if(!/^[a-zA-Z0-9:_-]{8,128}$/.test(args.idempotencyKey))refuse("Ungültiger Wiederholungsschlüssel.");
  return prisma.$transaction(async tx=>{
    const enrollment=await tx.journeyEnrollment.findFirst({
      where:{id:args.enrollmentId,userId:args.userId},select:{id:true,versionId:true,state:true}});
    if(!enrollment)refuse("Teilnahme nicht gefunden.");
    const existing=await tx.journeyTestAttempt.findUnique({
      where:{enrollmentId_idempotencyKey:{enrollmentId:enrollment.id,idempotencyKey:args.idempotencyKey}}});
    if(existing){
      if(existing.assessmentId!==args.assessmentId||JSON.stringify(existing.results)!==JSON.stringify(parsed))refuse("Wiederholungsschlüssel gehört zu anderen Ergebnissen.");
      return existing;
    }
    const assessment=await tx.journeyAssessment.findUnique({where:{id:args.assessmentId}});
    if(!assessment||assessment.versionId!==enrollment.versionId||!assessment.approvedAt)refuse("Test ist nicht für diesen Weg genehmigt.");
    journeyCriteriaSchema.parse(assessment.criteria); // Reject unclear / unapproved rule formats.
    if(assessment.kind==="CHAPTER_FINAL"){
      if(enrollment.state!=="ACTIVE"||!assessment.chapterId)refuse("Bestätigter Einstieg erforderlich.");
      const chapter=await tx.journeyChapter.findUnique({where:{id:assessment.chapterId},
        include:{items:{where:{mandatory:true},select:{id:true}}}});
      if(!chapter)refuse("Kapitel nicht gefunden.");
      const unlocked=await tx.journeyChapterUnlock.findUnique({where:{
        enrollmentId_chapterId:{enrollmentId:enrollment.id,chapterId:chapter.id}}});
      if(!unlocked)refuse("Kapitel ist noch gesperrt.");
      const completed=await tx.journeyChapterCompletion.findUnique({where:{
        enrollmentId_chapterId:{enrollmentId:enrollment.id,chapterId:chapter.id}}});
      if(completed)refuse("Kapitel wurde bereits bestanden.");
      const done=await tx.journeyActivityCompletion.count({where:{
        enrollmentId:enrollment.id,itemId:{in:chapter.items.map(x=>x.id)}}});
      if(done!==chapter.items.length)refuse("Pflichtinhalte müssen zuerst abgeschlossen werden.");
    }else{
      if(enrollment.state!=="PENDING"||assessment.chapterId)refuse("Einstufungstest gehört nicht zum offenen Einstieg.");
    }
    const rules=assessment.retestRules?journeyRetestSchema.parse(assessment.retestRules):null;
    if(rules&&rules.minHoursAfterFailure>0){
      const prior=await tx.journeyTestAttempt.findFirst({
        where:{enrollmentId:enrollment.id,assessmentId:assessment.id,verdict:"FAILED"},orderBy:{reviewedAt:"desc"}});
      if(prior?.reviewedAt&&Date.now()-prior.reviewedAt.getTime()<rules.minHoursAfterFailure*3600000)
        refuse("Nächster Versuch ist noch nicht freigeschaltet.");
    }
    return tx.journeyTestAttempt.create({data:{
      enrollmentId:enrollment.id,assessmentId:assessment.id,idempotencyKey:args.idempotencyKey,results:parsed
    }});
  });
}

/** Only an assigned coach/admin can finalize an attempt and grant one next chapter. */
export async function reviewJourneyAttempt(args:{
  attemptId:string;reviewerId:string;coachFeedbackDe?:string
}){
  return prisma.$transaction(async tx=>{
    const attempt=await tx.journeyTestAttempt.findUnique({where:{id:args.attemptId},
      include:{
        assessment:true,
        enrollment:{include:{
          version:{include:{levels:{orderBy:{position:"asc"},include:{chapters:{orderBy:{position:"asc"}}}}}}
        }}
      }});
    if(!attempt)refuse("Testversuch nicht gefunden.");
    await requireAssignedCoach(tx,args.reviewerId,attempt.enrollment.userId);
    if(attempt.verdict!=="PENDING")return {verdict:attempt.verdict,replayed:true};
    const criteria=journeyCriteriaSchema.parse(attempt.assessment.criteria);
    if(!attempt.assessment.approvedAt||attempt.assessment.versionId!==attempt.enrollment.versionId)
      refuse("Test nicht freigegeben.");
    const results=journeyResultsSchema.parse(attempt.results);
    const score=assessJourneyResults(criteria,results);
    const verdict:JourneyVerdict=score.passed?"PASSED":"FAILED";
    const claim=await tx.journeyTestAttempt.updateMany({where:{id:attempt.id,verdict:"PENDING"},
      data:{verdict,feedback:{...score,coachFeedbackDe:args.coachFeedbackDe??""},
        reviewedById:args.reviewerId,reviewedAt:new Date()}});
    if(claim.count!==1)refuse("Testversuch wird bereits geprüft.");
    let nextChapterId:string|null=null;
    let nextLevel:JourneyLevel|null=null;
    if(verdict==="PASSED"&&attempt.assessment.kind==="CHAPTER_FINAL"&&attempt.assessment.chapterId){
      const chapterId=attempt.assessment.chapterId;
      const allowed=await tx.journeyChapterUnlock.findUnique({where:{
        enrollmentId_chapterId:{enrollmentId:attempt.enrollmentId,chapterId}}});
      if(!allowed)refuse("Kapitel wurde nicht freigeschaltet.");
      const priorCompletion=await tx.journeyChapterCompletion.findUnique({where:{
        enrollmentId_chapterId:{enrollmentId:attempt.enrollmentId,chapterId}}});
      if(priorCompletion)refuse("Kapitel ist bereits bestanden.");
      await tx.journeyChapterCompletion.create({data:{
        enrollmentId:attempt.enrollmentId,chapterId,attemptId:attempt.id}});
      const levels=attempt.enrollment.version.levels;
      const chapters=levels.flatMap(l=>l.chapters.map(c=>({chapterId:c.id,levelId:l.id,levelCode:l.code})));
      const current=chapters.findIndex(x=>x.chapterId===chapterId);
      if(current<0)refuse("Kapitel passt nicht zu dieser Version.");
      const next=chapters[current+1];
      if(next){
        nextChapterId=next.chapterId;
        if(next.levelId!==chapters[current].levelId){
          nextLevel=next.levelCode;
          await tx.journeyLevelAward.upsert({
            where:{enrollmentId_levelId:{enrollmentId:attempt.enrollmentId,levelId:next.levelId}},
            update:{},create:{enrollmentId:attempt.enrollmentId,levelId:next.levelId,
              reason:"PASSED_CHAPTER_TEST",attemptId:attempt.id}
          });
          await tx.journeyEnrollment.update({where:{id:attempt.enrollmentId},
            data:{confirmedLevel:nextLevel}});
        }
        await tx.journeyChapterUnlock.upsert({
          where:{enrollmentId_chapterId:{enrollmentId:attempt.enrollmentId,chapterId:next.chapterId}},
          update:{},create:{enrollmentId:attempt.enrollmentId,chapterId:next.chapterId,
            reason:"PASSED_CHAPTER_TEST",attemptId:attempt.id,grantedById:args.reviewerId}
        });
      }else{
        await tx.journeyEnrollment.update({where:{id:attempt.enrollmentId},data:{state:"FINISHED",endedAt:new Date()}});
      }
    }
    return {verdict,score,nextChapterId,nextLevel,replayed:false};
  });
}

/**
 * Structural media gate for upcoming Step 8 endpoint integration.
 * This helper alone does not protect the pre-existing /api/media URL.
 */
export async function inspectJourneyMediaAccess(userId:string,variantId:string){
  const [user,variant]=await Promise.all([
    prisma.user.findUnique({where:{id:userId},select:{subscriptionTier:true}}),
    prisma.chapterMediaVariant.findUnique({where:{id:variantId},
      include:{item:{include:{chapter:{include:{level:true}}}}}})
  ]);
  if(!user||!variant)return {allowed:false,reason:"NOT_FOUND"} as const;
  const versionId=variant.item.chapter.level.versionId;
  const enrollment=await prisma.journeyEnrollment.findFirst({
    where:{userId,versionId,state:{in:["ACTIVE","FINISHED"]}},
    select:{id:true}
  });
  if(!enrollment)return {allowed:false,reason:"NO_CONFIRMED_ENROLLMENT"} as const;
  const unlock=await prisma.journeyChapterUnlock.findUnique({
    where:{enrollmentId_chapterId:{enrollmentId:enrollment.id,chapterId:variant.item.chapterId}},
    select:{id:true}
  });
  if(!unlock)return {allowed:false,reason:"LOCKED_CHAPTER"} as const;
  if(!canOpenJourneyMedia({earnedChapter:true,tier:user.subscriptionTier,minTier:variant.minTier}))
    return {allowed:false,reason:"SUBSCRIPTION_REQUIRED"} as const;
  return {allowed:true,reason:"AUTHORIZED",mediaAssetId:variant.mediaAssetId} as const;
}
