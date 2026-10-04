export function zonedParts(date:Date,timeZone:string){
  try{
    const parts=new Intl.DateTimeFormat("en-CA",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date);
    const get=(type:string)=>parts.find(p=>p.type===type)?.value||"";
    return {year:Number(get("year")),month:Number(get("month")),day:Number(get("day")),weekday:get("weekday"),hour:Number(get("hour")),minute:Number(get("minute")),dateKey:`${get("year")}-${get("month")}-${get("day")}`};
  }catch{
    return zonedParts(date,"Europe/Berlin");
  }
}
export function localMinutes(date:Date,timeZone:string){const p=zonedParts(date,timeZone);return p.hour*60+p.minute}
