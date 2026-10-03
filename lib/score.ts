export type Pillar="strength"|"endurance"|"athleticism"|"mobility"|"recovery"|"fuel"|"consistency";
export type ScoreInput=Record<Pillar,number|null>;
export type ScoreWeights=Record<Pillar,number>;

export const defaultWeights:ScoreWeights={
  strength:20,endurance:15,athleticism:15,mobility:10,recovery:15,fuel:10,consistency:15
};

export function calculateScore(input:ScoreInput,weights:ScoreWeights=defaultWeights){
  const keys=(Object.keys(input) as Pillar[]).filter(k=>input[k]!==null);
  if(!keys.length)return {score:null,completeness:0};
  const availableWeight=keys.reduce((sum,k)=>sum+weights[k],0);
  const weighted=keys.reduce((sum,k)=>sum+Math.max(0,Math.min(100,input[k]??0))*weights[k],0);
  return {score:Math.round(weighted/availableWeight),completeness:Math.round(availableWeight)};
}

export function levelForScore(score:number){
  if(score>=90)return "TRULY DIFFERENT";
  if(score>=75)return "BE DIFFERENT";
  if(score>=60)return "DIFFERENT";
  if(score>=40)return "AWAKE";
  return "NORMAL";
}

export type DailySignals={sleepHours?:number;recoveryScore?:number;missedWorkouts7d?:number};

export function recommendations(s:DailySignals){
  const out:{severity:"info"|"warning"|"critical";title:string;action:string}[]=[];
  if((s.sleepHours??8)<6)out.push({severity:"warning",title:"Schlaf unter Ziel",action:"Trainingsintensität heute moderat halten."});
  if((s.recoveryScore??100)<60)out.push({severity:"critical",title:"Recovery niedrig",action:"Mobility oder aktive Erholung statt Maximaltraining prüfen."});
  if((s.missedWorkouts7d??0)>=2)out.push({severity:"info",title:"Plan nicht vollständig",action:"Coach informieren und realistischen Wochenplan bestätigen."});
  return out;
}
