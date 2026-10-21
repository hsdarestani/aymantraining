import {prisma} from "./db";
import {journeyCriteriaSchema,journeyRetestSchema} from "./journey-contract";

function assessmentView(a:{
  id:string;titleDe:string;kind:string;criteria:unknown;retestRules:unknown;approvedAt:Date|null;
  attempts:{id:string;verdict:string;results:unknown;feedback:unknown;submittedAt:Date;reviewedAt:Date|null;reviewedById:string|null}[]
}){
  if(!a.approvedAt)return null;
  const parsed=journeyCriteriaSchema.safeParse(a.criteria);
  if(!parsed.success)return null;
  const rules=a.retestRules?journeyRetestSchema.safeParse(a.retestRules):null;
  const guidance=rules?.success?rules.data.guidanceDe??"": "";
  const delay=rules?.success?rules.data.minHoursAfterFailure:0;
  const attempts=[...a.attempts].sort((x,y)=>y.submittedAt.getTime()-x.submittedAt.getTime()).map(x=>({
    id:x.id,verdict:x.verdict,results:x.results,feedback:x.feedback,
    submittedAt:x.submittedAt.toISOString(),reviewedAt:x.reviewedAt?.toISOString()??null
  }));
  const latestFailed=attempts.find(x=>x.verdict==="FAILED"&&x.reviewedAt);
  const nextRetestAt=latestFailed&&delay?
    new Date(new Date(latestFailed.reviewedAt!).getTime()+delay*3600000).toISOString():null;
  const pending=attempts.some(x=>x.verdict==="PENDING");
  return {id:a.id,kind:a.kind,titleDe:a.titleDe,metrics:parsed.data.metrics,
    guidanceDe:guidance,attempts,nextRetestAt,
    canSubmit:!pending&&(!nextRetestAt||new Date(nextRetestAt).getTime()<=Date.now())};
}

export async function listAthleteJourneyTests(userId:string){
  const enrollments=await prisma.journeyEnrollment.findMany({
    where:{userId,version:{state:"PUBLISHED"}},
    include:{
      version:{include:{
        pathway:{select:{titleDe:true}},
        assessments:{where:{kind:"PLACEMENT",approvedAt:{not:null}},
          include:{attempts:{where:{enrollment:{userId}},orderBy:{submittedAt:"desc"},take:20}}},
        levels:{orderBy:{position:"asc"},include:{
          chapters:{orderBy:{position:"asc"},include:{
            items:{orderBy:{position:"asc"}},
            assessments:{where:{kind:"CHAPTER_FINAL",approvedAt:{not:null}},
              include:{attempts:{where:{enrollment:{userId}},orderBy:{submittedAt:"desc"},take:20}}}
          }}
        }}
      }},
      unlocks:{select:{chapterId:true}},
      activities:{select:{itemId:true}},
      completions:{select:{chapterId:true}}
    },
    orderBy:{startedAt:"desc"},take:10
  });
  return enrollments.map(e=>{
    const unlocked=new Set(e.unlocks.map(x=>x.chapterId));
    const completed=new Set(e.activities.map(x=>x.itemId));
    const finished=new Set(e.completions.map(x=>x.chapterId));
    return {
      id:e.id,state:e.state,selfLevel:e.selfLevel,confirmedLevel:e.confirmedLevel,
      pathway:e.version.pathway.titleDe,version:e.version.version,
      placement:e.state==="PENDING"?assessmentView(e.version.assessments[0]??null as never):null,
      chapters:e.version.levels.flatMap(level=>level.chapters.map(ch=>{
        const earned=unlocked.has(ch.id);
        const mandatory=ch.items.filter(x=>x.mandatory);
        return {
          id:ch.id,level:level.code,titleDe:ch.titleDe,
          unlocked:earned,finished:finished.has(ch.id),
          mandatoryTotal:earned?mandatory.length:0,
          mandatoryDone:earned?mandatory.filter(x=>completed.has(x.id)).length:0,
          items:earned?ch.items.map(x=>({id:x.id,titleDe:x.titleDe||"",kind:x.kind,
            description:x.description||"",mandatory:x.mandatory,done:completed.has(x.id)})):[],
          assessment:earned?ch.assessments.length?assessmentView(ch.assessments[0]):null:null
        };
      }))
    };
  });
}

export async function listPendingJourneyReviews(actor:{id:string;role:string}){
  const where=actor.role==="ADMIN"?{}:{
    enrollment:{user:{coachAssignments:{some:{
      coachId:actor.id,active:true,OR:[{endsAt:null},{endsAt:{gt:new Date()}}]
    }}}}
  };
  const attempts=await prisma.journeyTestAttempt.findMany({
    where:{...where,verdict:"PENDING",assessment:{approvedAt:{not:null},version:{state:"PUBLISHED"}}},
    include:{
      assessment:{select:{titleDe:true,kind:true,criteria:true}},
      enrollment:{select:{
        id:true,userId:true,selfLevel:true,
        user:{select:{name:true,email:true}},
        version:{select:{pathway:{select:{titleDe:true}}}}
      }}
    },
    orderBy:{submittedAt:"asc"},take:100
  });
  return attempts.map(a=>({
    id:a.id,enrollmentId:a.enrollmentId,assessmentId:a.assessmentId,
    submittedAt:a.submittedAt.toISOString(),results:a.results,
    athlete:{name:a.enrollment.user.name||"Athlet",email:a.enrollment.user.email},
    selfLevel:a.enrollment.selfLevel,
    kind:a.assessment.kind,titleDe:a.assessment.titleDe,criteria:a.assessment.criteria,
    pathway:a.enrollment.version.pathway.titleDe
  }));
}
