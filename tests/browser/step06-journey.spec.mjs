import {test,expect} from "@playwright/test";
import {PrismaClient} from "@prisma/client";
import {createHash} from "node:crypto";
test.skip(process.env.JOURNEY_TESTS_ENABLED!=="true","Step 06 preview only.");
const db=new PrismaClient(),base="http://127.0.0.1:3000",stamp=Date.now().toString(36);
let athlete,coach,tokens={},ch1,ch2,enroll;
async function makeSession(user,label){
 const token="step6_"+label+"_"+stamp;
 await db.authSession.create({data:{tokenHash:createHash("sha256").update(token).digest("hex"),
  expiresAt:new Date(Date.now()+86400000),userId:user.id}});
 tokens[label]=token;
}
test.beforeAll(async()=>{
 if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Isolated Postgres required");
 athlete=await db.user.create({data:{email:"step6-athlete-"+stamp+"@example.invalid",passwordHash:"test",role:"ATHLETE",onboardingCompleted:true}});
 coach=await db.user.create({data:{email:"step6-coach-"+stamp+"@example.invalid",passwordHash:"test",role:"COACH"}});
 await db.coachAssignment.create({data:{coachId:coach.id,athleteId:athlete.id,active:true}});
 await makeSession(athlete,"athlete");await makeSession(coach,"coach");
 const path=await db.journeyPathway.create({data:{slug:"step6_ui_"+stamp,titleDe:"Kraft und Athletik"}});
 const version=await db.journeyPathwayVersion.create({data:{pathwayId:path.id,version:1,state:"PUBLISHED",goalSlugs:["athleticism","muscle_building"]}});
 const level=await db.journeyLevelDefinition.create({data:{versionId:version.id,code:"READY",position:1,labelDe:"READY"}});
 ch1=await db.journeyChapter.create({data:{levelId:level.id,position:1,titleDe:"Kapitel Grundlagen"}});
 ch2=await db.journeyChapter.create({data:{levelId:level.id,position:2,titleDe:"Kapitel Technik"}});
 await db.journeyChapterItem.create({data:{chapterId:ch1.id,position:1,kind:"GUIDANCE",titleDe:"Grundlagen ausführen",description:"Fünf Minuten Grundlagen.",mandatory:true}});
 await db.journeyAssessment.create({data:{versionId:version.id,chapterId:ch1.id,kind:"CHAPTER_FINAL",titleDe:"Kapiteltest Grundlagen",
  criteria:{schemaVersion:1,metrics:[{key:"pushups",unit:"reps",min:12}]},approvedAt:new Date()}});
 enroll=await db.journeyEnrollment.create({data:{userId:athlete.id,versionId:version.id,state:"ACTIVE",
  confirmedLevel:"READY",confirmedAt:new Date(),selfLevel:"READY"}});
 await db.journeyChapterUnlock.create({data:{enrollmentId:enroll.id,chapterId:ch1.id,reason:"COACH_APPROVAL",grantedById:coach.id}});
});
test.afterAll(async()=>{await db.$disconnect()});
test("athlete submits a test, assigned coach reviews, next chapter unlocks in live UI",async({browser})=>{
 const athleteCtx=await browser.newContext();
 await athleteCtx.addCookies([{name:"bd_session",value:tokens.athlete,url:base,httpOnly:true,sameSite:"Lax"}]);
 const user=await athleteCtx.newPage();
 await user.goto(base+"/journey/tests");
 await expect(user.getByText("Kapitel Grundlagen")).toBeVisible();
 await expect(user.getByText("Kapitel Technik")).toBeVisible();
 await expect(user.getByText("GESPERRT")).toBeVisible();
 await user.getByRole("button",{name:"ALS ERLEDIGT MARKIEREN"}).click();
 await expect(user.getByText("1 von 1 Pflichtinhalten")).toBeVisible();
 await user.getByRole("spinbutton").fill("17");
 await user.getByRole("button",{name:"ERGEBNIS EINREICHEN"}).click();
 await expect(user.getByText("IN PRÜFUNG")).toBeVisible();
 const coachCtx=await browser.newContext();
 await coachCtx.addCookies([{name:"bd_session",value:tokens.coach,url:base,httpOnly:true,sameSite:"Lax"}]);
 const trainer=await coachCtx.newPage();
 await trainer.goto(base+"/admin/journey-tests");
 await expect(trainer.getByText("Kapiteltest Grundlagen")).toBeVisible();
 await trainer.getByRole("textbox",{name:"Persönliche Rückmeldung"}).fill("Saubere Technik, nächste Übung beginnen.");
 await trainer.getByRole("button",{name:"ERGEBNIS FACHLICH PRÜFEN"}).click();
 await expect(trainer.getByRole("status")).toContainText("nächstes Kapitel freigeschaltet");
 await user.reload();
 await expect(user.getByText("TEST BESTANDEN")).toBeVisible();
 const chapter= user.locator(".j6-chapter").filter({hasText:"Kapitel Technik"});
 await expect(chapter).toContainText("FREIGESCHALTET");
 expect(await db.journeyChapterUnlock.count({where:{enrollmentId:enroll.id}})).toBe(2);
 expect((await db.journeyEnrollment.findUnique({where:{id:enroll.id}})).confirmedLevel).toBe("READY");
 await athleteCtx.close();await coachCtx.close();
});
test("non-authenticated users cannot read or write tests or coach queue",async({request})=>{
 const user=await request.get(base+"/api/journey/tests");
 expect(user.status()).toBe(401);
 const coach=await request.get(base+"/api/admin/journey-tests");
 expect(coach.status()).toBe(401);
 const submit=await request.post(base+"/api/journey/tests/attempts",{data:{enrollmentId:"invalid",assessmentId:"invalid",idempotencyKey:"notrealtest",results:[]}});
 expect(submit.status()).toBe(401);
});
