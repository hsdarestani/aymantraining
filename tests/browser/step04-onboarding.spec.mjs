import {test,expect} from "@playwright/test";
import {PrismaClient} from "@prisma/client";
import {createHash} from "node:crypto";

const db=new PrismaClient();
const dateStamp=Date.now().toString(36);
const base="http://127.0.0.1:3000";
const passwordHash="isolated-test-only";
const tokens={};
let userWithoutPath,userWithPath,legacyUser,pathway;
const approvedPayload={
  goal:"Fußball",goals:["Fußball","Athletik","Muskelaufbau"],selfLevel:"TRULY_DIFFERENT",
  dashboard:"GENERAL",birthDate:"2001-02-10",sex:"male",heightCm:179,weightKg:77,
  trainingExperience:"ADVANCED",availabilityPerWeek:4,healthConsent:false,
  privacyConsent:true,termsConsent:true,pushups:15,plankSeconds:40
};
async function sessionFor(user,name){
  const token=name+"-bd-step04-"+dateStamp;
  await db.authSession.create({data:{
    tokenHash:createHash("sha256").update(token).digest("hex"),userId:user.id,
    expiresAt:new Date(Date.now()+86400000)
  }});
  tokens[name]=token;
}
function auth(name){return {Authorization:"Bearer "+tokens[name],"x-bd-client":"mobile"};}
test.beforeAll(async()=>{
  if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Isolated bedifferent_test database required");
  userWithoutPath=await db.user.create({data:{email:"step4-unknown-"+dateStamp+"@example.invalid",passwordHash}});
  userWithPath=await db.user.create({data:{email:"step4-curated-"+dateStamp+"@example.invalid",passwordHash}});
  legacyUser=await db.user.create({data:{email:"step4-legacy-"+dateStamp+"@example.invalid",passwordHash}});
  await sessionFor(userWithoutPath,"unmatched");await sessionFor(userWithPath,"matched");await sessionFor(legacyUser,"legacy");
  pathway=await db.journeyPathway.create({data:{slug:"step4-curated-"+dateStamp,titleDe:"Fußball plus Athletik und Muskelaufbau"}});
  await db.journeyPathwayVersion.create({data:{
    pathwayId:pathway.id,version:1,state:"PUBLISHED",
    goalSlugs:["athleticism","football","muscle_building"],publishedAt:new Date()
  }});
});
test.afterAll(async()=>{
  await db.authSession.deleteMany({where:{userId:{in:[userWithoutPath?.id,userWithPath?.id,legacyUser?.id].filter(Boolean)}}});
  await db.journeyEnrollment.deleteMany({where:{userId:{in:[userWithoutPath?.id,userWithPath?.id,legacyUser?.id].filter(Boolean)}}});
  await db.journeyIntake.deleteMany({where:{userId:{in:[userWithoutPath?.id,userWithPath?.id,legacyUser?.id].filter(Boolean)}}});
  await db.goal.deleteMany({where:{userId:{in:[userWithoutPath?.id,userWithPath?.id,legacyUser?.id].filter(Boolean)}}});
  await db.user.deleteMany({where:{id:{in:[userWithoutPath?.id,userWithPath?.id,legacyUser?.id].filter(Boolean)}}});
  await db.journeyPathwayVersion.deleteMany({where:{pathwayId:pathway?.id}});
  await db.journeyPathway.deleteMany({where:{id:pathway?.id}});
  await db.$disconnect();
});
test("five levels and multi goal selectors are visible in enabled web onboarding",async({page})=>{
  await page.goto(base+"/onboarding");
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button",{name:/WEITER/}).click();
  await page.locator(".goals").getByRole("button",{name:/Fußball/}).click();
  await page.locator(".goals").getByRole("button",{name:/Muskelaufbau/}).click();
  await expect(page.locator(".goals button.selected")).toHaveCount(3);
  await page.getByRole("button",{name:/WEITER/}).click();
  await page.locator(".segmented-field").getByRole("button",{name:"Weiblich"}).click();
  await expect(page.getByText("OPTIONALE STARTANSICHT")).toBeVisible();
  await page.getByRole("checkbox",{name:/Frauen-Dashboard als Startansicht/}).check();
  await page.getByRole("button",{name:/WEITER/}).click();
  await expect(page.locator(".journey-level")).toHaveCount(5);
  await expect(page.locator(".journey-level.selected")).toHaveCount(0);
  await page.locator(".journey-level").last().click();
  await expect(page.locator(".journey-level.selected")).toContainText("TRULY DIFFERENT");
  await expect(page.getByText(/schaltet noch keine Kapitel/)).toBeVisible();
});
test("unknown combination persists without inventing or unlocking a path",async({request})=>{
  const response=await request.post(base+"/api/onboarding/complete",{data:{
    ...approvedPayload,goals:["Fußball","Fettabbau"],dashboard:"GENERAL"
  },headers:auth("unmatched")});
  expect(response.status()).toBe(200);
  const body=await response.json();
  expect(body.journey.status).toBe("PENDING_PATHWAY");
  expect(body.journey.confirmedLevel).toBeNull();
  const intake=await db.journeyIntake.findUnique({where:{userId:userWithoutPath.id}});
  expect(intake.status).toBe("PENDING_PATHWAY");
  expect(intake.selfLevel).toBe("TRULY_DIFFERENT");
  expect(intake.selectedGoalSlugs).toEqual(["fat_loss","football"]);
  expect(await db.journeyChapterUnlock.count()).toBe(0);
  const status=await request.get(base+"/api/journey/onboarding",{headers:auth("unmatched")});
  expect((await status.json()).journey.confirmedLevel).toBeNull();
});
test("curated combination produces a PENDING enrollment not an earned level",async({request})=>{
  const r=await request.post(base+"/api/onboarding/complete",{data:approvedPayload,headers:auth("matched")});
  expect(r.status()).toBe(200);
  const payload=await r.json();
  expect(payload.journey.status).toBe("PENDING_PLACEMENT");
  const enroll=await db.journeyEnrollment.findFirst({where:{userId:userWithPath.id}});
  expect(enroll.state).toBe("PENDING");
  expect(enroll.confirmedLevel).toBeNull();
  expect(await db.journeyLevelAward.count({where:{enrollmentId:enroll.id}})).toBe(0);
  const goals=await db.goal.findMany({where:{userId:userWithPath.id,active:true}});
  expect(goals).toHaveLength(3);
  const replay=await request.post(base+"/api/onboarding/complete",{data:approvedPayload,headers:auth("matched")});
  expect(replay.status()).toBe(200);
  expect((await replay.json()).replayed).toBe(true);
  const changed=await request.post(base+"/api/onboarding/complete",{data:{...approvedPayload,selfLevel:"READY"},headers:auth("matched")});
  expect(changed.status()).toBe(409);
});
test("invalid goals or cross-gender optional view are rejected without writes",async({request})=>{
  const invalid=await request.post(base+"/api/onboarding/complete",{data:{...approvedPayload,goals:["Fußball","Hacking"]},headers:auth("legacy")});
  expect(invalid.status()).toBe(422);
  const invalidDashboard=await request.post(base+"/api/onboarding/complete",{data:{...approvedPayload,dashboard:"WOMEN"},headers:auth("legacy")});
  expect(invalidDashboard.status()).toBe(422);
  expect(await db.journeyIntake.count({where:{userId:legacyUser.id}})).toBe(0);
});
test("legacy single goal registration stays compatible without journey intake",async({request})=>{
  const old={...approvedPayload};delete old.goals;delete old.selfLevel;delete old.dashboard;
  const result=await request.post(base+"/api/onboarding/complete",{data:old,headers:auth("legacy")});
  expect(result.status()).toBe(200);
  expect((await result.json()).journey).toBeUndefined();
  expect(await db.journeyIntake.count({where:{userId:legacyUser.id}})).toBe(0);
  const active=await db.goal.findMany({where:{userId:legacyUser.id,active:true}});
  expect(active).toHaveLength(1);
});
