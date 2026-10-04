export type AthleteContextLike={
  nextMatchAt:Date|null;
  travelModeUntil:Date|null;
  cycleTrackingEnabled:boolean;
  cycleStartDate:Date|null;
  cycleLengthDays:number;
};

export function contextualWorkout<T extends {scheduledAt:Date|null;exercises:Array<any>}>(workout:T,ctx:AthleteContextLike|null,now=new Date()){
  if(!ctx)return {...workout,contextAdjustment:null};
  const scheduled=workout.scheduledAt??now;
  let setFactor=1,rpeDelta=0,reason:string|null=null;
  if(ctx.nextMatchAt){
    const hours=(ctx.nextMatchAt.getTime()-scheduled.getTime())/3600000;
    if(hours>=0&&hours<=48){setFactor=.6;rpeDelta=-1;reason="SPIELTAG VORBEREITUNG"}
    else if(hours<0&&hours>=-30){setFactor=.5;rpeDelta=-2;reason="REGENERATION NACH SPIELTAG"}
  }
  if(ctx.cycleTrackingEnabled&&ctx.cycleStartDate){
    const len=Math.max(20,ctx.cycleLengthDays||28);
    const days=Math.max(0,Math.floor((scheduled.getTime()-ctx.cycleStartDate.getTime())/86400000));
    const cycleDay=days%len+1;
    if(cycleDay<=5){setFactor=Math.min(setFactor,.8);rpeDelta=Math.min(rpeDelta,-1);reason=reason??"ZYKLUS KONTEXT"}
  }
  const travel=Boolean(ctx.travelModeUntil&&ctx.travelModeUntil>scheduled);
  const exercises=workout.exercises.map((x:any)=>({
    ...x,
    targetSets:Math.max(1,Math.round((x.targetSets??3)*setFactor)),
    targetRpe:x.targetRpe==null?null:Math.max(4,Math.min(10,x.targetRpe+rpeDelta)),
    travelPreferred:travel?!(x.exercise?.equipment&&String(x.exercise.equipment).trim()):false
  }));
  if(travel)reason=reason?reason+" · REISEMODUS":"REISEMODUS";
  return {...workout,exercises,contextAdjustment:reason};
}
