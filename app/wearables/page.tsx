import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import WearablesClient from "./WearablesClient";

export default async function WearablesPage(){
  const user=await requireUser();
  const demo=user.role==="ADMIN"&&user.email==="admin@bedifferent.smarbiz.sbs";
  const samples=demo?await prisma.wearableDaily.findMany({
    where:{userId:user.id,source:"demo_preview"},
    orderBy:{date:"desc"},take:7,
    select:{date:true,steps:true,sleepMinutes:true,restingHr:true,hrv:true,vo2max:true}
  }):[];
  return <WearablesClient demoPreview={demo&&samples.length?{
    samples:samples.map(x=>({
      date:x.date.toISOString().slice(0,10),
      steps:x.steps??0,
      sleepMinutes:x.sleepMinutes??0,
      restingHr:x.restingHr??0,
      hrv:x.hrv??0,
      vo2max:x.vo2max??0
    }))
  }:null}/>;
}
