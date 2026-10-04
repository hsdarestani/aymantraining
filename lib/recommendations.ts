import {prisma} from "./db";
import {dateOnly} from "./http";

type JsonMap=Record<string,any>;
type Context={
  now:Date;
  checks:any[];
  wearable:any[];
  workouts:any[];
  nutrition:any[];
  body:any|null;
  goals:string[];
  acuteChronicRatio:number|null;
  prDetected:boolean;
};

function avg(values:number[]){return values.length?values.reduce((a,b)=>a+b,0)/values.length:null}

function countMatches(values:Array<number|null|undefined>,cfg:any){
  const window=Math.max(1,Number(cfg.window||cfg.windowDays||values.length||1));
  const list=values.slice(0,window).filter((v):v is number=>v!=null);
  const required=Number(cfg.count||1);
  const matches=list.filter(v=>
    (cfg.lt==null||v<Number(cfg.lt))&&
    (cfg.lte==null||v<=Number(cfg.lte))&&
    (cfg.gt==null||v>Number(cfg.gt))&&
    (cfg.gte==null||v>=Number(cfg.gte))
  ).length;
  return matches>=required;
}

function explain(key:string){
  const map:Record<string,string>={
    sleepHours:"Mehrere Schlafwerte liegen unter dem konfigurierten Ziel.",
    hrvVsBaseline:"HRV liegt unter deinem persönlichen Normalwert.",
    restingHrVsBaseline:"Ruhepuls liegt über deinem persönlichen Normalwert.",
    missedWorkouts:"Mehrere geplante Einheiten wurden nicht abgeschlossen.",
    proteinGPerKg:"Protein lag mehrfach unter dem konfigurierten Ziel pro Kilogramm Körpergewicht.",
    waterMl:"Trinkmenge lag mehrfach unter dem konfigurierten Ziel.",
    acuteChronicRatio:"Die Trainingslast der letzten 7 Tage liegt deutlich über dem persönlichen 28 Tage Trend.",
    prDetected:"Ein neuer persönlicher Leistungsbestwert wurde erkannt."
  };
  return map[key]||"Eine Coaching Regel wurde ausgelöst.";
}

function evaluateCondition(key:string,cfg:any,c:Context){
  if(key==="sleepHours"){
    const wearable=c.wearable.map(w=>w.sleepMinutes==null?null:w.sleepMinutes/60);
    const checks=c.checks.map(x=>x.sleepHours);
    const values=wearable.some(v=>v!=null)?wearable:checks;
    return countMatches(values,cfg);
  }
  if(key==="hrvVsBaseline"){
    const vals=c.wearable.map(w=>w.hrv).filter((v):v is number=>v!=null).reverse();
    if(vals.length<6)return false;
    const recent=avg(vals.slice(-3)),base=avg(vals.slice(0,-3));
    if(recent==null||base==null||base===0)return false;
    const pct=(recent/base-1)*100;
    return (cfg.lt==null||pct<Number(cfg.lt))&&(cfg.gt==null||pct>Number(cfg.gt));
  }
  if(key==="restingHrVsBaseline"){
    const vals=c.wearable.map(w=>w.restingHr).filter((v):v is number=>v!=null).reverse();
    if(vals.length<6)return false;
    const recent=avg(vals.slice(-3)),base=avg(vals.slice(0,-3));
    if(recent==null||base==null||base===0)return false;
    const pct=(recent/base-1)*100;
    return (cfg.gt==null||pct>Number(cfg.gt))&&(cfg.lt==null||pct<Number(cfg.lt));
  }
  if(key==="missedWorkouts"){
    const days=Math.max(1,Number(cfg.windowDays||7));
    const since=new Date(c.now.getTime()-days*86400000);
    const count=c.workouts.filter(w=>w.scheduledAt&&w.scheduledAt>=since&&w.scheduledAt<c.now&&!w.completedAt).length;
    return (cfg.gte==null||count>=Number(cfg.gte))&&(cfg.gt==null||count>Number(cfg.gt));
  }
  if(key==="proteinGPerKg"){
    if(cfg.goal&&!c.goals.includes(String(cfg.goal)))return false;
    const kg=c.body?.weightKg;if(!kg)return false;
    const values=c.nutrition.map(n=>n.proteinG==null?null:n.proteinG/kg);
    return countMatches(values,cfg);
  }
  if(key==="waterMl")return countMatches(c.nutrition.map(n=>n.waterMl),cfg);
  if(key==="acuteChronicRatio"){
    if(c.acuteChronicRatio==null)return false;
    return (cfg.gt==null||c.acuteChronicRatio>Number(cfg.gt))&&(cfg.lt==null||c.acuteChronicRatio<Number(cfg.lt));
  }
  if(key==="prDetected")return cfg.eq===undefined?c.prDetected:Boolean(cfg.eq)===c.prDetected;
  return false;
}

async function buildContext(userId:string):Promise<Context>{
  const now=new Date(),thirty=new Date(now.getTime()-30*86400000),seven=new Date(now.getTime()-7*86400000);
  const [checks,wearable,workouts,nutrition,body,goals,sets]=await Promise.all([
    prisma.dailyCheck.findMany({where:{userId,date:{gte:thirty}},orderBy:{date:"desc"}}),
    prisma.wearableDaily.findMany({where:{userId,date:{gte:thirty}},orderBy:{date:"desc"}}),
    prisma.workout.findMany({where:{userId,scheduledAt:{gte:thirty}},include:{sets:true},orderBy:{scheduledAt:"desc"}}),
    prisma.nutritionDaily.findMany({where:{userId,date:{gte:thirty}},orderBy:{date:"desc"}}),
    prisma.bodyMetric.findFirst({where:{userId},orderBy:{date:"desc"}}),
    prisma.goal.findMany({where:{userId,active:true},select:{type:true}}),
    prisma.setLog.findMany({where:{workout:{userId},completedAt:{gte:thirty}},orderBy:{completedAt:"desc"},take:500})
  ]);
  const load=(ws:any[])=>ws.reduce((sum,w)=>sum+(w.sets?.length||1)*(w.rpe||6),0);
  const acute=load(workouts.filter(w=>(w.scheduledAt?.getTime()||0)>=seven.getTime()));
  const chronic=load(workouts.filter(w=>(w.scheduledAt?.getTime()||0)<seven.getTime()));
  const weeks=Math.max(1,23/7);
  const chronicWeekly=chronic/weeks;
  const acuteChronicRatio=chronicWeekly>0?acute/chronicWeekly:null;

  let prDetected=false;
  const latestWorkout=workouts.find(w=>w.completedAt);
  if(latestWorkout){
    const latestIds=new Set(latestWorkout.sets.map((s:any)=>s.id));
    for(const s of latestWorkout.sets){
      const current=(s.weightKg??1)*(s.reps??1);
      const prior=sets.filter(x=>x.exerciseId===s.exerciseId&&!latestIds.has(x.id)).map(x=>(x.weightKg??1)*(x.reps??1));
      if(prior.length&&current>Math.max(...prior)){prDetected=true;break}
    }
  }
  return {now,checks,wearable,workouts,nutrition,body,goals:goals.map(g=>g.type),acuteChronicRatio,prDetected};
}

export async function evaluateRecommendations(userId:string){
  const context=await buildContext(userId);
  const rules=await prisma.coachingRule.findMany({where:{enabled:true},orderBy:{priority:"asc"}});
  const out:Array<{severity:string;title:string;explanation:string;action:string;sourceRule:string}>=[];
  for(const rule of rules){
    const conditions=(rule.conditions||{}) as JsonMap;
    const entries=Object.entries(conditions);
    if(!entries.length)continue;
    const passed=entries.every(([key,cfg])=>evaluateCondition(key,cfg,context));
    if(!passed)continue;
    const action=(rule.action||{}) as JsonMap;
    out.push({
      severity:String(action.severity||"info"),
      title:String(action.title||rule.title),
      explanation:entries.map(([key])=>explain(key)).join(" "),
      action:String(action.action||"Coach prüft die Empfehlung und entscheidet final."),
      sourceRule:rule.key
    });
  }

  // Subjective energy remains a built in safety fallback when no custom rule covers it.
  const lowEnergy=context.checks.slice(0,3).filter(c=>(c.energy??10)<=4).length;
  if(lowEnergy>=2&&!out.some(x=>x.sourceRule==="subjective_energy_low"))out.push({
    severity:"warning",title:"Energie mehrfach niedrig",
    explanation:"Dein subjektives Energielevel war in mehreren aktuellen Check ins niedrig.",
    action:"Belastung heute kontrollieren und Recovery priorisieren.",
    sourceRule:"subjective_energy_low"
  });

  const athleteContext=await prisma.athleteContext.findUnique({where:{userId}});
  if(athleteContext?.nextMatchAt){
    const hours=(athleteContext.nextMatchAt.getTime()-context.now.getTime())/3600000;
    if(hours>=0&&hours<=48)out.unshift({
      severity:"info",title:"Spieltag steht bevor",
      explanation:"Dein eingetragener Spieltag liegt in den nächsten zwei Tagen.",
      action:"Trainingsvolumen reduzieren und Technik, Beweglichkeit und Frische priorisieren.",
      sourceRule:"match_day_taper"
    });
    if(hours<0&&hours>=-30)out.unshift({
      severity:"info",title:"Regeneration nach dem Spiel",
      explanation:"Dein eingetragener Spieltag war vor kurzem.",
      action:"Regeneration, Schlaf, Flüssigkeit und lockere Bewegung priorisieren. Dein Trainer entscheidet über die nächste Belastung.",
      sourceRule:"match_day_recovery"
    });
  }
  if(athleteContext?.travelModeUntil&&athleteContext.travelModeUntil>context.now)out.push({
    severity:"info",title:"Reisemodus aktiv",
    explanation:"Du hast Training auf Reisen aktiviert.",
    action:"Heute Übungen ohne Geräte und kurze Einheiten priorisieren.",
    sourceRule:"travel_mode"
  });
  if(athleteContext?.cycleTrackingEnabled&&athleteContext.cycleStartDate){
    const length=Math.max(20,athleteContext.cycleLengthDays||28);
    const days=Math.max(0,Math.floor((dateOnly(context.now).getTime()-dateOnly(athleteContext.cycleStartDate).getTime())/86400000));
    const cycleDay=days%length+1;
    if(cycleDay<=5)out.push({
      severity:"info",title:"Zyklus Kontext aktiv",
      explanation:`Du hast Zyklustag ${cycleDay} als Kontext freigegeben.`,
      action:"Subjektives Befinden und Regeneration heute besonders beachten. Die Funktion ist keine medizinische Bewertung.",
      sourceRule:"cycle_context"
    });
  }

  const today=dateOnly(context.now);
  await prisma.recommendation.deleteMany({where:{userId,date:today,coachStatus:"PENDING"}});
  for(const rec of out)await prisma.recommendation.create({data:{userId,date:today,...rec}});
  return out;
}
