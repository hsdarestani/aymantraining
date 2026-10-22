import {prisma} from "./db";
import {dateOnly} from "./http";
import {getDailyProfile} from "./daily-profile-service";
import {getVerifiedEngagement,getMilestoneSnapshot} from "./milestone-service";
import {milestonesEnabled} from "./milestone-contract";

const dayMs=86400000;
const keyOf=(d:Date)=>dateOnly(d).toISOString().slice(0,10);

async function unlock(userId:string,key:string,name:string){
  return prisma.badge.upsert({where:{userId_key:{userId,key}},update:{name},create:{userId,key,name}});
}

export async function gamificationSnapshot(userId:string){
  const now=new Date(),since=new Date(Date.now()-120*dayMs);
  const [workouts,checks,wearables,tests,dailyProfile,earnedAwards,badges,entries,verified]=await Promise.all([
    prisma.workout.findMany({where:{userId,completedAt:{gte:since}},select:{completedAt:true,sets:true}}),
    prisma.dailyCheck.findMany({where:{userId,date:{gte:since}},select:{date:true,energy:true,mood:true,stress:true,soreness:true,sleepHours:true}}),
    prisma.wearableDaily.findMany({where:{userId,date:{gte:new Date(Date.now()-14*dayMs)}},select:{date:true,sleepMinutes:true}}),
    prisma.performanceTest.findMany({where:{userId,completedAt:{not:null}},include:{results:true}}),
    getDailyProfile(userId),
    process.env.JOURNEY_OVERVIEW_ENABLED==="true"
      ?prisma.journeyLevelAward.findMany({where:{enrollment:{userId,state:{in:["ACTIVE","FINISHED"]}}},select:{level:{select:{code:true}}}})
      :Promise.resolve([]),
    prisma.badge.findMany({where:{userId},orderBy:{unlockedAt:"desc"}}),
    prisma.challengeEntry.findMany({where:{userId}}),
    getVerifiedEngagement(userId,now)
  ]);

  // One real, timezone-correct eligible day; app opens and empty checks never qualify.
  const streak=verified.streak;

  const completed=verified.workoutCount;
  const sleepValues=[
    ...wearables.map(w=>w.sleepMinutes==null?null:w.sleepMinutes/60),
    ...checks.map(c=>c.sleepHours)
  ].filter((v):v is number=>v!=null);
  const avgSleep=sleepValues.length?sleepValues.reduce((a,b)=>a+b,0)/sleepValues.length:0;
  const sprint=tests.some(t=>t.results.some(r=>/30m_sprint|sprint/i.test(r.metric)));
  // Old BD Score thresholds are not earned training levels.
  const latestLevel=dailyProfile.journey.confirmedLevel;
  const awarded=new Set(earnedAwards.map(a=>a.level.code));

  const awards:Array<[string,string,boolean]>=[
    ["first_workout","FIRST STEP",completed>=1],
    ["ten_workouts","10 WORKOUTS",completed>=10],
    ["hundred_workouts","100 WORKOUTS",completed>=100],
    ["different_7","7 DAYS DIFFERENT",streak>=7],
    ["different_30","30 DAYS DIFFERENT",streak>=30],
    ["iron_sleep","IRON SLEEP",sleepValues.length>=5&&avgSleep>=7.5],
    ["sprint_king","SPRINT KING",sprint],
    ["level_awake","AWAKE",(awarded.has("AWAKE")||awarded.has("DIFFERENT")||awarded.has("BE_DIFFERENT")||awarded.has("TRULY_DIFFERENT"))],
    ["level_different","DIFFERENT",(awarded.has("DIFFERENT")||awarded.has("BE_DIFFERENT")||awarded.has("TRULY_DIFFERENT"))],
    ["level_be_different","BE DIFFERENT",(awarded.has("BE_DIFFERENT")||awarded.has("TRULY_DIFFERENT"))],
    ["level_truly","TRULY DIFFERENT",awarded.has("TRULY_DIFFERENT")]
  ];
  for(const [key,name,yes] of awards)if(yes)await unlock(userId,key,name);

  for(const entry of entries){
    let progress=entry.progress;
    if(entry.challengeId==="challenge-30-different")progress=Math.min(100,streak/30*100);
    if(entry.challengeId==="challenge-pushups"){
      const pushups=tests.flatMap(t=>t.results).filter(r=>/pushup|pushups|push_up/i.test(r.metric)).reduce((s,r)=>s+r.value,0);
      const setReps=workouts.flatMap(w=>w.sets).reduce((s,x)=>s+(x.reps??0),0);
      progress=Math.min(100,(pushups+setReps)/100*100);
    }
    if(entry.challengeId==="challenge-recovery-pro"){
      const recoveryDays=checks.filter(c=>{const parts=[c.energy,c.mood,c.stress==null?null:11-c.stress,c.soreness==null?null:11-c.soreness].filter((v):v is number=>v!=null);const score=parts.length?parts.reduce((a,b)=>a+b,0)/parts.length:0;return score>=7;}).length;
      progress=Math.min(100,recoveryDays/7*100);
    }
    await prisma.challengeEntry.update({where:{id:entry.id},data:{progress,completedAt:progress>=100?(entry.completedAt??new Date()):null}});
  }

  const milestone=milestonesEnabled()?await getMilestoneSnapshot(userId,now):null;
  return {
    streak,
    milestones:milestone?{enabled:true,streak:milestone.streak,best:milestone.best,
      todayStatus:milestone.todayStatus,awards:milestone.awards,next:milestone.next}:null,
    completedWorkouts:completed,
    level:latestLevel,
    badges:await prisma.badge.findMany({where:{userId},orderBy:{unlockedAt:"desc"}}),
    entries:await prisma.challengeEntry.findMany({where:{userId}})
  };
}

export async function improvementLeaderboard(){
  const users=await prisma.user.findMany({where:{role:"ATHLETE"},select:{id:true,name:true,birthDate:true,scoreSnapshots:{where:{date:{gte:new Date(Date.now()-35*dayMs)}},orderBy:{date:"asc"},take:40}}});
  return users.map(u=>{
    const first=u.scoreSnapshots[0],last=u.scoreSnapshots.at(-1);
    const improvement=first&&last?last.total-first.total:0;
    const age=u.birthDate?Math.floor((Date.now()-u.birthDate.getTime())/31557600000):null;
    const displayName=age!=null&&age<18?`Athlete ${u.id.slice(-4).toUpperCase()}`:(u.name||"Athlete");
    return {userId:u.id,name:displayName,improvement,current:last?.total??0};
  }).sort((a,b)=>b.improvement-a.improvement).slice(0,20);
}
