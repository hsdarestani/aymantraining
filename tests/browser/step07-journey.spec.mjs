import {test,expect} from "@playwright/test";
import {PrismaClient} from "@prisma/client";
import {createHash} from "node:crypto";
test.skip(process.env.JOURNEY_OVERVIEW_ENABLED!=="true","Journey overview disabled.");
const db=new PrismaClient(),base="http://127.0.0.1:3000",stamp=Date.now().toString(36);
let athlete,legacy,outsider,enrollment,openChapter,closedChapter,tokens={};
async function session(user,label){
 const token="step07-"+label+"-"+stamp;
 tokens[label]=token;
 await db.authSession.create({data:{userId:user.id,tokenHash:createHash("sha256").update(token).digest("hex"),
  expiresAt:new Date(Date.now()+86400000)}});
}
test.beforeAll(async()=>{
 if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Disposable test database only.");
 athlete=await db.user.create({data:{email:"journey-athlete-"+stamp+"@example.invalid",passwordHash:"x",onboardingCompleted:true}});
 legacy=await db.user.create({data:{email:"journey-old-"+stamp+"@example.invalid",passwordHash:"x",onboardingCompleted:true}});
 outsider=await db.user.create({data:{email:"journey-other-"+stamp+"@example.invalid",passwordHash:"x",onboardingCompleted:true}});
 await session(athlete,"athlete");await session(legacy,"legacy");await session(outsider,"outsider");
 await db.goal.create({data:{userId:legacy.id,type:"football"}});
 const pathway=await db.journeyPathway.create({data:{slug:"step07_browser_"+stamp,titleDe:"Athletik mit Fußball"}});
 const version=await db.journeyPathwayVersion.create({data:{pathwayId:pathway.id,version:1,state:"PUBLISHED",goalSlugs:["football","athleticism"],publishedAt:new Date()}});
 const level=await db.journeyLevelDefinition.create({data:{versionId:version.id,position:1,code:"READY",labelDe:"READY"}});
 const next=await db.journeyLevelDefinition.create({data:{versionId:version.id,position:2,code:"AWAKE",labelDe:"AWAKE"}});
 openChapter=await db.journeyChapter.create({data:{levelId:level.id,position:1,titleDe:"Freier Abschnitt",description:"Dein Training heute"}});
 closedChapter=await db.journeyChapter.create({data:{levelId:level.id,position:2,titleDe:"Gesperrter Abschnitt",description:"Vertraulich"}});
 await db.journeyChapterItem.create({data:{chapterId:openChapter.id,position:1,kind:"GUIDANCE",titleDe:"Kniebeugen Technik",description:"Nur innerhalb eines verdienten Kapitels",mandatory:true}});
 await db.journeyChapterItem.create({data:{chapterId:closedChapter.id,position:1,kind:"GUIDANCE",titleDe:"Versteckte nächste Übung",description:"Geheim",mandatory:true}});
 await db.journeyChapter.create({data:{levelId:next.id,position:1,titleDe:"Aufbau"}});
 enrollment=await db.journeyEnrollment.create({data:{userId:athlete.id,versionId:version.id,state:"ACTIVE",confirmedLevel:"READY"}});
 await db.journeyLevelAward.create({data:{enrollmentId:enrollment.id,levelId:level.id,reason:"COACH_APPROVAL"}});
 await db.journeyChapterUnlock.create({data:{enrollmentId:enrollment.id,chapterId:openChapter.id,reason:"COACH_APPROVAL"}});
});
test.afterAll(async()=>db.$disconnect());
async function asUser(browser,label){
 const ctx=await browser.newContext();
 await ctx.addCookies([{name:"bd_session",value:tokens[label],url:base,httpOnly:true,sameSite:"Lax"}]);
 return {ctx,page:await ctx.newPage()};
}
test("athlete sees five-stage plan previews but can open only earned chapter",async({browser})=>{
 const {ctx,page}=await asUser(browser,"athlete");
 await page.goto(base+"/journey");
 await expect(page.getByRole("heading",{name:"Dein Weg. Dein Fortschritt."})).toBeVisible();
 await expect(page.getByText("Athletik mit Fußball")).toBeVisible();
 await expect(page.locator(".j7-chapter")).toHaveCount(3);
 await expect(page.locator(".j7-locked")).toHaveCount(2);
 await expect(page.getByText("Versteckte nächste Übung")).toHaveCount(0);
 await page.locator(".j7-unlocked").first().click();
 await expect(page.getByText("Kniebeugen Technik")).toBeVisible();
 await expect(page.getByText("Nur innerhalb eines verdienten Kapitels")).toBeVisible();
 const forbidden=await page.evaluate(async({id,enrollmentId})=>{
  const result=await fetch("/api/journey/chapters/"+id+"?enrollmentId="+enrollmentId);
  return result.status;
 },{id:closedChapter.id,enrollmentId:enrollment.id});
 expect(forbidden).toBe(403);
 await ctx.close();
});
test("legacy user explicitly opts in and old goals remain active",async({browser})=>{
 const {ctx,page}=await asUser(browser,"legacy");
 await page.goto(base+"/journey");
 await expect(page.getByText("FREIWILLIGER WECHSEL")).toBeVisible();
 await page.locator(".j7-goals").getByText("Fußball").click();
 await page.locator(".j7-goals").getByText("Athletik").click();
 await page.getByText("Ich möchte den neuen Weg beginnen").click();
 await page.getByRole("button",{name:"WECHSEL VORMERKEN"}).click();
 await expect(page.getByText("Einstufung wird geprüft.")).toBeVisible();
 expect((await db.journeyIntake.findUnique({where:{userId:legacy.id}})).selfLevel).toBe("READY");
 expect(await db.goal.count({where:{userId:legacy.id,active:true,type:"football"}})).toBe(1);
 expect(await db.journeyChapterUnlock.count({where:{enrollment:{userId:legacy.id}}})).toBe(0);
 await ctx.close();
});
test("private chapter details never leak across users",async({browser})=>{
 const {ctx,page}=await asUser(browser,"outsider");
 await page.goto(base+"/journey");
 const response=await page.evaluate(async({id,enrollmentId})=>{
  const result=await fetch("/api/journey/chapters/"+id+"?enrollmentId="+enrollmentId);
  return result.status;
 },{id:openChapter.id,enrollmentId:enrollment.id});
 expect(response).toBe(404);
 await ctx.close();
});
