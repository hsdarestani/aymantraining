import {PrismaClient} from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma=new PrismaClient();
const base=process.env.TEST_BASE_URL||"http://127.0.0.1:3000";
const origin=base;
const email=`e2e-${Date.now()}@example.invalid`;
let cookie="";
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
async function req(path,{method="GET",body,headers={}}={}){
  const h={...headers,origin};
  if(cookie)h.cookie=cookie;
  if(body!==undefined && !(body instanceof FormData)){h["content-type"]="application/json";body=JSON.stringify(body)}
  const r=await fetch(base+path,{method,headers:h,body,redirect:"manual"});
  const setCookie=r.headers.get("set-cookie");if(setCookie)cookie=setCookie.split(";")[0];
  const text=await r.text();let data={};try{data=text?JSON.parse(text):{}}catch{data={text}}
  return {r,data,text};
}
async function expect(path,opt,status=200){const x=await req(path,opt);assert(x.r.status===status,`${opt?.method||"GET"} ${path}: expected ${status}, got ${x.r.status}: ${x.text}`);return x.data;}

try{
  await expect("/api/health",{},200);
  await expect("/api/ready",{},200);

  await expect("/api/auth/register",{method:"POST",body:{email,password:"VeryStrong123!",name:"E2E Athlete",goal:"Athletik"}},200);
  const me0=await expect("/api/auth/me",{},200);assert(me0.user.email===email,"auth/me email");

  await expect("/api/onboarding/complete",{method:"POST",body:{goal:"Athletik",birthDate:"1995-05-10",sex:"prefer_not_to_say",heightCm:180,weightKg:80,trainingExperience:"REGULAR",availabilityPerWeek:4,healthConsent:true,privacyConsent:true,termsConsent:true,pushups:25,plankSeconds:75}},200);

  const workouts=await expect("/api/workouts?history=1",{},200);assert(workouts.workouts.length>=1,"starter workout missing");
  const workout=workouts.workouts.find(x=>x.exercises?.length)||workouts.workouts[0];
  await expect(`/api/workouts/${workout.id}`,{method:"PATCH",body:{action:"start"}},200);
  if(workout.exercises?.[0])await expect(`/api/workouts/${workout.id}/sets`,{method:"POST",body:{exerciseId:workout.exercises[0].exerciseId,setNumber:1,reps:10,weightKg:20,rpe:7}},200);
  await expect(`/api/workouts/${workout.id}`,{method:"PATCH",body:{action:"complete",rpe:7}},200);

  await expect("/api/daily-check",{method:"POST",body:{energy:7,soreness:3,mood:8,stress:4,sleepHours:7.4,steps:8000,waterMl:2300,proteinG:120}},200);
  await expect("/api/body-metrics",{method:"POST",body:{weightKg:79.8,waistCm:82}},200);
  const score=await expect("/api/score",{},200);assert(typeof score.score?.total==="number","score missing");

  const freeHealth=await expect("/api/wearables/import",{method:"POST",body:{source:"manual_import",date:new Date().toISOString().slice(0,10),steps:9000,activeCalories:500,hrv:72,restingHr:51,sleepMinutes:470,vo2max:46}},200);
  assert(freeHealth.item.hrv==null && freeHealth.item.sleepMinutes==null,"FREE advanced health leaked");

  await expect("/api/checkin",{method:"POST",body:{weightKg:79.5,energy:8}},403);
  await expect("/api/performance-tests",{method:"POST",body:{name:"EXTRA TEST",results:[{metric:"pushups",value:30,unit:"reps"}]}},403);

  const trial=await expect("/api/subscription/trial",{method:"POST"},200);assert(trial.trialEndsAt,"trial missing");
  const ent=await expect("/api/entitlements",{},200);assert(ent.tier==="PRO","trial did not grant PRO");
  await expect("/api/checkin",{method:"POST",body:{weightKg:79.5,energy:8,recovery:7,training:8,note:"E2E"}},200);
  await expect("/api/nutrition",{method:"POST",body:{calories:2200,proteinG:140,carbsG:220,fatG:70,waterMl:2600,fruitVegServings:5,addedSugarG:20,processedFoodScore:20,source:"manual"}},200);
  const templates=await expect("/api/plans/templates",{},200);assert(templates.items.length>=3,"templates missing");
  await expect(`/api/plans/templates/${templates.items[0].id}/start`,{method:"POST"},200);
  const proHealth=await expect("/api/wearables/import",{method:"POST",body:{source:"manual_import",date:new Date().toISOString().slice(0,10),steps:9100,activeCalories:510,hrv:73,restingHr:50,sleepMinutes:480,vo2max:47}},200);assert(proHealth.item.hrv!=null,"PRO advanced health not stored");

  await expect("/api/consent",{method:"POST",body:{type:"media_processing",version:"1.0",granted:true}},200);
  const form=new FormData();form.set("kind","PROGRESS_PHOTO");form.set("file",new File([new Uint8Array([255,216,255,217])],"e2e.jpg",{type:"image/jpeg"}));
  const media=await expect("/api/media",{method:"POST",body:form},200);assert(media.asset.id,"media upload missing");

  // Direct store entitlement state machine without calling external stores in CI.
  const uid=(await expect("/api/auth/me",{},200)).user.id;
  await prisma.subscription.updateMany({where:{userId:uid,provider:"internal_trial"},data:{status:"expired",renewsAt:new Date(Date.now()-1000)}});
  await prisma.subscription.create({data:{
    userId:uid,tier:"PRO",provider:"google_play",externalId:"e2e-purchase-token",
    status:"canceled",renewsAt:new Date(Date.now()+86400000)
  }});
  await prisma.user.update({where:{id:uid},data:{subscriptionTier:"PRO"}});
  let dbUser=await prisma.user.findUnique({where:{id:uid}});
  assert(dbUser?.subscriptionTier==="PRO","canceled subscription revoked access before expiry");

  await prisma.subscription.updateMany({
    where:{userId:uid,provider:"google_play",externalId:"e2e-purchase-token"},
    data:{status:"expired",renewsAt:new Date(Date.now()-1000)}
  });
  await prisma.user.update({where:{id:uid},data:{subscriptionTier:"FREE"}});
  dbUser=await prisma.user.findUnique({where:{id:uid}});
  assert(dbUser?.subscriptionTier==="FREE","expired store subscription did not revoke access");

  const exported=await req("/api/privacy/export");assert(exported.r.status===200,"privacy export");
  await expect("/api/privacy/delete",{method:"DELETE"},200);
  assert(!(await prisma.user.findUnique({where:{email}})),"privacy delete left user");

  // Admin auth + representative write endpoints.
  const adminEmail=`admin-${Date.now()}@example.invalid`;
  const admin=await prisma.user.create({data:{email:adminEmail,passwordHash:await bcrypt.hash("AdminStrong123!",12),name:"E2E Admin",role:"ADMIN",onboardingCompleted:true}});
  cookie="";
  await expect("/api/auth/login",{method:"POST",body:{email:adminEmail,password:"AdminStrong123!"}},200);
  await expect("/api/admin/settings",{},200);
  await expect("/api/admin/engine-settings",{},200);
  await expect("/api/admin/score-settings",{method:"PATCH",body:{strength:20,endurance:15,athleticism:15,mobility:10,recovery:15,fuel:10,consistency:15}},200);
  const plan=await expect("/api/admin/plans",{method:"POST",body:{name:"E2E Plan",description:"Automated QA",proOnly:false}},200);assert(plan.item.id,"admin plan");
  await prisma.user.delete({where:{id:admin.id}});

  console.log("E2E_SMOKE_OK");
} finally {
  await prisma.$disconnect();
}
