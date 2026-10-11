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
