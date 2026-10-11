import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
// Complete route inventory for the production demo. This script is read-only
// except an ephemeral auth session deleted at the end.
const db=new PrismaClient();
let id;
const host="http://127.0.0.1:3100";
const routes=[
"/dashboard","/focus","/training","/progress","/fuel","/lifestyle","/tests","/athlete","/athlete/photos","/library","/plans","/report","/checkin","/coach","/ai","/community","/settings","/wearables","/pricing",
"/admin","/admin/customers","/admin/plans","/admin/plans/new","/admin/exercises","/admin/tests","/admin/inbox","/admin/team","/admin/ai","/admin/events","/admin/briefs","/admin/kpi","/admin/norms","/admin/rules","/admin/settings","/admin/campaigns","/admin/subscriptions"
];
async function main(){
  const user=await db.user.findUnique({where:{email:"admin@bedifferent.smarbiz.sbs"}});
  if(!user||user.role!=="ADMIN"||user.name!=="Ayman")throw Error("Admin audit guard failed");
  const token=crypto.randomBytes(48).toString("base64url");
  const tokenHash=crypto.createHash("sha256").update(token).digest("hex");
  const session=await db.authSession.create({data:{userId:user.id,tokenHash,expiresAt:new Date(Date.now()+600000)}});
  id=session.id;
  const demoCustomers=await db.user.findMany({where:{role:"ATHLETE",email:{endsWith:"@example.invalid"}},select:{id:true,email:true},take:4});
  for(const c of demoCustomers){routes.push("/admin/customers/"+c.id);routes.push("/admin/inbox/"+c.id)}
  const exercise=await db.exercise.findFirst({where:{active:true},select:{id:true}});
  if(exercise){routes.push("/exercise/"+exercise.id);routes.push("/admin/exercises/"+exercise.id)}
  const plan=await db.trainingPlan.findFirst({where:{active:true},select:{id:true}});
  if(plan)routes.push("/admin/plans/"+plan.id);
  const workout=await db.workout.findFirst({where:{userId:user.id},orderBy:{scheduledAt:"desc"},select:{id:true}});
  if(workout)routes.push("/training/"+workout.id);
  const headers={cookie:"bd_session="+token,host:"bedifferent.smarbiz.sbs"};
  const failures=[],missing=[];
  for(const route of routes){
    try{
      const res=await fetch(host+route,{headers,redirect:"manual",signal:AbortSignal.timeout(15000)});
      const html=await res.text();
      const status=res.status;
      const empty=[...html.matchAll(/Keine Angabe|Noch keine|Keine Daten|KEINE DATEN|keine Daten|Nicht verbunden|NICHT VERBUNDEN|Noch nicht|Keine Werte/g)].length;
      // RSC/HTML includes text twice sometimes; this number is a diagnostic only.
      const hasNoDemo=route.startsWith("/admin")&&html.includes("DEMO ANSICHT")===false;
      console.log(JSON.stringify({route,status,htmlLength:html.length,emptyMarkers:empty,hasDemoBanner:!hasNoDemo}));
      if(status!==200)failures.push(route+":"+status);
      if(html.length<1800)missing.push(route+":short");
    }catch(e){console.log(JSON.stringify({route,error:String(e).slice(0,160)}));failures.push(route+":request_error")}
  }
  console.log("ROUTE_AUDIT_TOTAL="+routes.length);
  console.log("ROUTE_AUDIT_ERRORS="+JSON.stringify(failures));
  console.log("ROUTE_AUDIT_THIN_PAGES="+JSON.stringify(missing));
  if(failures.length)process.exitCode=1;
}
main().catch(e=>{console.error("ROUTE_AUDIT_ERROR",e.message);process.exitCode=1}).finally(async()=>{
  if(id)await db.authSession.deleteMany({where:{id}}).catch(()=>{console.error("SESSION_CLEANUP_FAILED");process.exitCode=1});
  await db.$disconnect();
});
