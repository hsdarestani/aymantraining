import {prisma} from "./db";
import {dateOnly} from "./http";

export type Pillar="strength"|"endurance"|"athleticism"|"mobility"|"recovery"|"fuel"|"consistency";
export const DEFAULT_WEIGHTS:Record<Pillar,number>={strength:20,endurance:15,athleticism:15,mobility:10,recovery:15,fuel:10,consistency:15};
export type ScoreFormula={sleepTargetHours:number;proteinTargetGPerKg:number;waterTargetMl:number;checkinsPerWeek:number;performanceChangeMultiplier:number};
export const DEFAULT_FORMULA:ScoreFormula={sleepTargetHours:8,proteinTargetGPerKg:1.6,waterTargetMl:2500,checkinsPerWeek:5,performanceChangeMultiplier:125};

const clamp=(v:number)=>Math.max(0,Math.min(100,Math.round(v)));
const average=(v:number[])=>v.length?v.reduce((a,b)=>a+b,0)/v.length:null;

async function settings(){
  const rows=await prisma.systemSetting.findMany({where:{key:{in:["score_weights","score_formula"]}}});
  const map=new Map(rows.map(r=>[r.key,r.value]));
  return {
    weights:{...DEFAULT_WEIGHTS,...((map.get("score_weights") as Partial<Record<Pillar,number>>|undefined)??{})},
    formula:{...DEFAULT_FORMULA,...((map.get("score_formula") as Partial<ScoreFormula>|undefined)??{})}
  };
}

function ratioScore(current:number|null,baseline:number|null,multiplier:number,higher=true){
  if(current==null||baseline==null||baseline===0)return null;
  const change=higher?current/baseline-1:1-current/baseline;
  return clamp(50+change*multiplier);
}

async function normalizedMetric(userId:string,names:string[],multiplier:number){
  const [user,metric,body,norms]=await Promise.all([
    prisma.user.findUnique({where:{id:userId},select:{birthDate:true,sex:true}}),
    prisma.testResult.findMany({where:{test:{userId},metric:{in:names}},include:{test:true},orderBy:{createdAt:"desc"},take:12}),
    prisma.bodyMetric.findFirst({where:{userId},orderBy:{date:"desc"}}),
    prisma.referenceNorm.findMany({where:{metric:{in:names}}})
  ]);
  if(!metric.length)return null;
  const latest=metric[0].value;
  let age:number|undefined;
  if(user?.birthDate)age=Math.floor((Date.now()-user.birthDate.getTime())/31557600000);
  const norm=norms.find(n=>
    (!n.sex||!user?.sex||n.sex===user.sex)&&
    (n.minAge==null||age==null||age>=n.minAge)&&
    (n.maxAge==null||age==null||age<=n.maxAge)&&
    (n.minWeight==null||body?.weightKg==null||body.weightKg>=n.minWeight)&&
    (n.maxWeight==null||body?.weightKg==null||body.weightKg<=n.maxWeight)
  );
  if(norm&&norm.highValue!==norm.lowValue){
    const raw=norm.higherIsBetter?(latest-norm.lowValue)/(norm.highValue-norm.lowValue):(norm.highValue-latest)/(norm.highValue-norm.lowValue);
    return clamp(raw*100);
  }
  const oldest=metric.at(-1)!.value;
  return ratioScore(latest,oldest,multiplier,!names.some(n=>/time|sprint|5k/i.test(n)));
}

export async function recomputeScoreForUser(userId:string,when=new Date()){
  const {weights,formula}=await settings();
  const end=when;
  const seven=new Date(end.getTime()-7*86400000);
  const thirty=new Date(end.getTime()-30*86400000);
  const fortyTwo=new Date(end.getTime()-42*86400000);
  const eightyFour=new Date(end.getTime()-84*86400000);

  const [wearables,checks,nutrition,recentSets,baselineSets,workouts,body,strengthTest,enduranceTest,athleticTest,mobilityTest,previous]=await Promise.all([
    prisma.wearableDaily.findMany({where:{userId,date:{gte:thirty,lte:end}},orderBy:{date:"asc"}}),
    prisma.dailyCheck.findMany({where:{userId,date:{gte:seven,lte:end}},orderBy:{date:"asc"}}),
    prisma.nutritionDaily.findMany({where:{userId,date:{gte:seven,lte:end}},orderBy:{date:"asc"}}),
    prisma.setLog.findMany({where:{workout:{userId},completedAt:{gte:fortyTwo,lte:end}}}),
    prisma.setLog.findMany({where:{workout:{userId},completedAt:{gte:eightyFour,lt:fortyTwo}}}),
    prisma.workout.findMany({where:{userId,scheduledAt:{gte:seven,lte:end}}}),
    prisma.bodyMetric.findFirst({where:{userId},orderBy:{date:"desc"}}),
    normalizedMetric(userId,["pushups","pullups","dips","strength"],formula.performanceChangeMultiplier),
    normalizedMetric(userId,["5k_time","vo2max","endurance"],formula.performanceChangeMultiplier),
    normalizedMetric(userId,["30m_sprint","jump","athleticism"],formula.performanceChangeMultiplier),
    normalizedMetric(userId,["mobility","mobility_score"],formula.performanceChangeMultiplier),
    prisma.scoreSnapshot.findFirst({where:{userId,date:{lt:dateOnly(when)}},orderBy:{date:"desc"}})
  ]);

  const recentVolume=recentSets.reduce((s,x)=>s+(x.weightKg??1)*(x.reps??1),0);
  const baselineVolume=baselineSets.reduce((s,x)=>s+(x.weightKg??1)*(x.reps??1),0);
  const strength=strengthTest??(recentSets.length&&baselineSets.length?ratioScore(recentVolume/42,baselineVolume/42,formula.performanceChangeMultiplier):null);

  const vo2=wearables.map(w=>w.vo2max).filter((v):v is number=>v!=null);
  const endurance=enduranceTest??(vo2.length>1?ratioScore(vo2.at(-1)!,vo2[0],formula.performanceChangeMultiplier):null);
  const athleticism=athleticTest;
  const mobility=mobilityTest;

  const sleep=average(wearables.map(w=>w.sleepMinutes==null?NaN:w.sleepMinutes/60).filter(Number.isFinite));
  const hrv=wearables.map(w=>w.hrv).filter((v):v is number=>v!=null);
  const rhr=wearables.map(w=>w.restingHr).filter((v):v is number=>v!=null);
  const subjective=average(checks.flatMap(c=>[
    c.energy==null?NaN:c.energy*10,
    c.mood==null?NaN:c.mood*10,
    c.stress==null?NaN:110-c.stress*10,
    c.soreness==null?NaN:110-c.soreness*10
  ]).filter(Number.isFinite));

  const recoveryParts:number[]=[];
  if(sleep!=null)recoveryParts.push(clamp(sleep/formula.sleepTargetHours*100));
  if(hrv.length>3){const x=ratioScore(average(hrv.slice(-3)),average(hrv.slice(0,-3)),formula.performanceChangeMultiplier);if(x!=null)recoveryParts.push(x)}
  if(rhr.length>3){const x=ratioScore(average(rhr.slice(-3)),average(rhr.slice(0,-3)),formula.performanceChangeMultiplier,false);if(x!=null)recoveryParts.push(x)}
  if(subjective!=null)recoveryParts.push(clamp(subjective));
  const recoveryAvg=average(recoveryParts);
  const recovery=recoveryAvg==null?null:clamp(recoveryAvg);

  const fuelParts:number[]=[];
  const protein=average(nutrition.map(n=>n.proteinG).filter((v):v is number=>v!=null));
  const water=average(nutrition.map(n=>n.waterMl).filter((v):v is number=>v!=null));
  const targetProtein=(body?.weightKg??80)*formula.proteinTargetGPerKg;
  if(protein!=null)fuelParts.push(clamp(protein/Math.max(1,targetProtein)*100));
  if(water!=null)fuelParts.push(clamp(water/Math.max(1,formula.waterTargetMl)*100));
  const direct=average(nutrition.map(n=>n.fuelScore).filter((v):v is number=>v!=null));
  if(direct!=null)fuelParts.push(direct);
  const fuelAvg=average(fuelParts);
  const fuel=fuelAvg==null?null:clamp(fuelAvg);

  const planned=workouts.filter(w=>w.scheduledAt!=null).length;
  const completed=workouts.filter(w=>w.completedAt!=null).length;
  const checkConsistency=Math.min(1,checks.length/Math.max(1,formula.checkinsPerWeek));
  const planConsistency=planned?completed/planned:null;
  const consistency=planConsistency==null&&!checks.length?null:clamp(((planConsistency??checkConsistency)*.75+checkConsistency*.25)*100);

  const values:Record<Pillar,number|null>={strength,endurance,athleticism,mobility,recovery,fuel,consistency};
  const present=(Object.keys(values) as Pillar[]).filter(k=>values[k]!=null);
  const available=present.reduce((s,k)=>s+weights[k],0);
  const weighted=present.reduce((s,k)=>s+(values[k]??0)*weights[k],0);
  const total=available?clamp(weighted/available):0;
  const completeness=clamp(available);

  const prevValues:Record<Pillar,number|null>={
    strength:previous?.strength??null,endurance:previous?.endurance??null,athleticism:previous?.athleticism??null,mobility:previous?.mobility??null,
    recovery:previous?.recovery??null,fuel:previous?.fuel??null,consistency:previous?.consistency??null
  };
  const explanation=present.map(k=>{
    const value=values[k]!;
    const old=prevValues[k];
    const delta=old==null?null:value-old;
    const reason=k==="recovery"?"Schlaf, persönlicher HRV und Ruhepuls Trend sowie Befinden":
      k==="consistency"?"Planerfüllung und Check ins der letzten 7 Tage":
      k==="fuel"?"Ernährung, Protein und Trinkmenge":
      "Tests, Referenznormen und mehrwöchiger Leistungstrend";
    return {pillar:k,value,delta,text:`${delta==null?"Startwert":`${delta>=0?"+":""}${delta} Prozent`} · ${reason}.`};
  });

  return prisma.scoreSnapshot.upsert({
    where:{userId_date:{userId,date:dateOnly(when)}},
    update:{total,strength,endurance,athleticism,mobility,recovery,fuel,consistency,completeness,explanation},
    create:{userId,date:dateOnly(when),total,strength,endurance,athleticism,mobility,recovery,fuel,consistency,completeness,explanation}
  });
}

export function levelForScore(score:number){
  if(score>=90)return"TRULY DIFFERENT";
  if(score>=75)return"BE DIFFERENT";
  if(score>=60)return"DIFFERENT";
  if(score>=40)return"AWAKE";
  return"NORMAL";
}
