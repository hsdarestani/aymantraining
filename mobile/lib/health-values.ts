export function localDay(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`}
export function localDayStart(now=new Date()){const start=new Date(now);start.setHours(0,0,0,0);return start}
export function numeric(value:unknown):number|undefined{
 if(value&&typeof value==="object"){const unit=value as Record<string,unknown>;value=unit.inKilocalories??unit.inKilograms}
 return typeof value==="number"&&Number.isFinite(value)?value:undefined;
}
export function sumValues(samples:any[],key="quantity"){const values=samples.map(s=>numeric(s[key]??s.value)).filter((v):v is number=>v!=null);return values.length?values.reduce((a,b)=>a+b,0):undefined}
export function latestValue(samples:any[],key="quantity"){
 const sorted=[...samples].sort((a,b)=>new Date(b.time??b.endTime??b.endDate??0).getTime()-new Date(a.time??a.endTime??a.endDate??0).getTime());
 for(const sample of sorted){const value=numeric(sample[key]??sample.value);if(value!=null)return value}return undefined;
}
export function sleepDuration(samples:{start:unknown;end:unknown}[]){
 const intervals=samples.map(s=>[new Date(s.start as string).getTime(),new Date(s.end as string).getTime()]).filter(([a,b])=>Number.isFinite(a)&&Number.isFinite(b)&&b>a).sort((a,b)=>a[0]-b[0]);if(!intervals.length)return undefined;
 let [start,end]=intervals[0],total=0;for(const [a,b] of intervals.slice(1)){if(a<=end)end=Math.max(end,b);else{total+=end-start;start=a;end=b}}return Math.round((total+end-start)/60000);
}
