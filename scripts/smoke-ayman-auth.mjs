import crypto from "node:crypto";
import {PrismaClient} from "@prisma/client";
const db=new PrismaClient();
let sessionId=null;
const origin="http://127.0.0.1:3100";
async function main(){
 const user=await db.user.findUnique({where:{email:"admin@bedifferent.smarbiz.sbs"}});
 if(!user||user.role!=="ADMIN"||user.name!=="Ayman")throw Error("Expected admin profile not found");
 const token=crypto.randomBytes(40).toString("base64url");
 const tokenHash=crypto.createHash("sha256").update(token).digest("hex");
 const row=await db.authSession.create({data:{userId:user.id,tokenHash,expiresAt:new Date(Date.now()+240000)}});
 sessionId=row.id;
 const pages=[
  ["/dashboard","DEMO ANSICHT"],["/focus","Dein Moment"],["/training","Dein Plan"],
  ["/progress","Leistung wird"],["/lifestyle","Schlaf"],["/fuel","Kalorienbilanz"],
  ["/tests","Testen."],["/athlete","ATHLETENPROFIL"],["/athlete/photos","GALERIE"],
  ["/community","Gemeinsam"],["/admin","TRAINERZENTRALE"],["/admin/customers","Kunden"],
  ["/admin/team","Trainer"],["/admin/inbox","Nachrichten"],["/admin/events","Events"],
  ["/admin/briefs","Morgenübersicht"],["/admin/ai","Trainer Kontrolle"],["/admin/kpi","DEMO DATEN"]
 ];
 const errors=[];
 for(const [route,marker] of pages){
   try{
    const r=await fetch(origin+route,{headers:{cookie:"bd_session="+token,host:"bedifferent.smarbiz.sbs"},redirect:"manual",signal:AbortSignal.timeout(12000)});
    const html=await r.text();
    const markerOk=html.includes(marker);
    console.log("PAGE",route,"STATUS",r.status,"CONTENT_CHECK",markerOk?"YES":"NO");
    if(r.status!==200||!markerOk)errors.push(route);
   }catch(e){console.log("PAGE",route,"ERROR",e.name);errors.push(route);}
 }
 // Validate the mobile-admin cards and every DEMO customer profile after deployment.
 const adminResponse=await fetch(origin+"/admin",{headers:{cookie:"bd_session="+token,host:"bedifferent.smarbiz.sbs"},signal:AbortSignal.timeout(12000)});
 const adminHtml=await adminResponse.text();
 if(adminResponse.status!==200||!adminHtml.includes("attention-row")||!adminHtml.includes("attention-action"))errors.push("admin-mobile-action-layout");
 const listResponse=await fetch(origin+"/admin/customers",{headers:{cookie:"bd_session="+token,host:"bedifferent.smarbiz.sbs"},signal:AbortSignal.timeout(12000)});
 const listHtml=await listResponse.text();
 if(listResponse.status!==200||!listHtml.includes("customer-row")||!listHtml.includes("customer-action"))errors.push("admin-mobile-customers-layout");
 for(let i=1;i<=3;i++){
   const email="demo.athlete."+i+"@example.invalid";
   const demo=await db.user.findUnique({where:{email},include:{goals:{where:{active:true}}}});
   const count=demo?await db.bodyMetric.count({where:{userId:demo.id}}):0;
   const weekly=demo?await db.weeklyCheckIn.count({where:{userId:demo.id}}):0;
   const nutrition=demo?await db.nutritionDaily.count({where:{userId:demo.id}}):0;
   const dataOK=Boolean(demo?.birthDate&&demo.heightCm&&demo.availabilityPerWeek&&demo.goals.length&&count&&weekly&&nutrition>=7);
   if(!demo){errors.push("missing-demo-"+i);continue;}
   const page=await fetch(origin+"/admin/customers/"+demo.id,{headers:{cookie:"bd_session="+token,host:"bedifferent.smarbiz.sbs"},signal:AbortSignal.timeout(12000)});
   const body=await page.text();
   const contentOK=page.status===200&&body.includes(email)&&body.includes("customer-email")&&body.includes("customer-profile-values");
   console.log("DEMO_CUSTOMER_"+i,"PROFILE_VALUES",dataOK?"PRESENT":"MISSING","PAGE_STATUS",page.status,"RESPONSIVE_CLASSES",contentOK?"YES":"NO");
   if(!dataOK||!contentOK)errors.push("demo-profile-"+i);
 }
 const endpoints=["/api/focus","/api/score","/api/weekly-report","/api/admin/team","/api/admin/ai","/api/admin/events","/api/media?kind=PROGRESS_PHOTO"];
 for(const route of endpoints){
   try{
    const r=await fetch(origin+route,{headers:{cookie:"bd_session="+token,host:"bedifferent.smarbiz.sbs"},redirect:"manual",signal:AbortSignal.timeout(12000)});
    let j=null;try{j=await r.json()}catch{}
    const ok=r.status===200&&j?.ok===true;
    console.log("API",route,"STATUS",r.status,"OK",ok?"YES":"NO");
    if(!ok)errors.push(route);
    if(route.startsWith("/api/media")&&ok){
      const count=Array.isArray(j.items)?j.items.length:0;
      console.log("PRIVATE_PHOTO_COUNT",count);
      if(count<6)errors.push("photos-under-six");
    }
   }catch(e){console.log("API",route,"ERROR",e.name);errors.push(route);}
 }
 if(errors.length)throw Error("Failed routes: "+errors.join(", "));
 console.log("ALL_AYMAN_AUTHENTICATED_SMOKE_CHECKS=PASS");
}
main().catch(e=>{console.error("SMOKE_FAILURE",e.message);process.exitCode=1}).finally(async()=>{
 if(sessionId)await db.authSession.deleteMany({where:{id:sessionId}}).catch(()=>{console.error("TEMP_SESSION_DELETE_FAILED");process.exitCode=1});
 await db.$disconnect();
});
