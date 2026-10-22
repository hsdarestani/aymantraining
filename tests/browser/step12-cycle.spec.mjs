import {test,expect} from "@playwright/test";
import {PrismaClient} from "@prisma/client";
import {createHash} from "node:crypto";
test.skip(process.env.CYCLE_JOURNAL_ENABLED!=="true","Cycle module disabled");
const db=new PrismaClient(),host="http://127.0.0.1:3000",stamp=Date.now().toString(36);
let athlete,other,coach,tokens={};
async function createUser(role,label){
 const user=await db.user.create({data:{email:"cycle-"+label+"-"+stamp+"@example.invalid",role,passwordHash:"test",onboardingCompleted:true}});
 const token="cycle_"+label+"_"+stamp;tokens[label]=token;
 await db.authSession.create({data:{userId:user.id,tokenHash:createHash("sha256").update(token).digest("hex"),expiresAt:new Date(Date.now()+3600000)}});return user;
}
async function browserAs(browser,label){
 const ctx=await browser.newContext();
 await ctx.addCookies([{name:"bd_session",value:tokens[label],url:host,httpOnly:true,sameSite:"Lax"}]);
 return {ctx,page:await ctx.newPage()};
}
async function send(page,path,body,method="POST"){
 return page.evaluate(async ({path,body,method})=>{
  const response=await fetch(path,{method,headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  return {status:response.status,body:await response.json()};
 },{path,body,method});
}
test.beforeAll(async()=>{
 if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Isolated test database only");
 athlete=await createUser("ATHLETE","owner");other=await createUser("ATHLETE","other");coach=await createUser("COACH","coach");
 await db.coachAssignment.create({data:{coachId:coach.id,athleteId:athlete.id,active:true}});
});
test.afterAll(async()=>{await db.$disconnect()});
test("no recording before explicit consent; no score, plan or level changes",async({browser})=>{
 const a=await browserAs(browser,"owner");await a.page.goto(host+"/cycle");
 expect((await send(a.page,"/api/cycle/entries",{date:"2026-10-10",energy:4},"PUT")).status).toBe(409);
 expect((await send(a.page,"/api/athlete-context",{cycleTrackingEnabled:true})).status).toBe(409);
 expect((await send(a.page,"/api/cycle/preferences",{action:"ENABLE"})).status).toBe(422);
 const opted=await send(a.page,"/api/cycle/preferences",{action:"ENABLE",acknowledgeSensitiveData:true});
 expect(opted.status).toBe(200);expect(opted.body.shareWithCoach).toBe(false);
 const saved=await send(a.page,"/api/cycle/entries",{date:"2026-10-10",flow:"LIGHT",symptoms:["CRAMPS"],energy:4,mood:5,discomfort:7,planChoice:"EASIER"},"PUT");
 expect(saved.status).toBe(200);
 const settings=await send(a.page,"/api/cycle/preferences",{action:"UPDATE",lastPeriodStart:"2026-10-10",cycleLengthDays:28,remindersEnabled:true});
 expect(settings.status).toBe(200);
 const data=await a.page.evaluate(async()=>(await (await fetch("/api/cycle")).json()));
 expect(data.entries[0].symptoms).toContain("CRAMPS");
 expect(data.forecast.approximate).toBe(true);
 expect(data.forecast.notForContraception).toBe(true);
 expect(await db.journeyLevelAward.count({where:{enrollment:{userId:athlete.id}}})).toBe(0);
 expect(await db.workout.count({where:{userId:athlete.id}})).toBe(0);
 await a.page.goto(host+"/cycle");
 await expect(a.page.getByRole("heading",{name:/DEIN ZYKLUS/})).toBeVisible();
 await a.ctx.close();
});
test("coach access is disabled until separate grant; minimized after consent; revocation immediate",async({browser})=>{
 const a=await browserAs(browser,"owner"),c=await browserAs(browser,"coach"),o=await browserAs(browser,"other");
 await a.page.goto(host+"/cycle");await c.page.goto(host+"/login");await o.page.goto(host+"/cycle");
 async function coachRead(page){return page.evaluate(async id=>{
  const response=await fetch("/api/cycle/coach/"+id);
  return {status:response.status,body:await response.json()};
 },athlete.id);}
 expect((await coachRead(c.page)).status).toBe(403);
 expect((await send(a.page,"/api/cycle/preferences",{action:"SHARE",shareWithCoach:true})).status).toBe(422);
 expect((await send(a.page,"/api/cycle/preferences",{action:"SHARE",shareWithCoach:true,confirmShare:true})).status).toBe(200);
 const shared=await coachRead(c.page);expect(shared.status).toBe(200);expect(shared.body.shared).toBe(true);
 expect(JSON.stringify(shared.body)).not.toContain("CRAMPS");
 expect(JSON.stringify(shared.body)).not.toContain("LIGHT");
 expect(JSON.stringify(shared.body)).not.toContain("forecast");
 expect((await coachRead(o.page)).status).toBe(403);
 await db.coachAssignment.updateMany({where:{athleteId:athlete.id,coachId:coach.id},data:{endsAt:new Date(Date.now()-3600000)}});
 expect((await coachRead(c.page)).status).toBe(403);
 await db.coachAssignment.updateMany({where:{athleteId:athlete.id,coachId:coach.id},data:{endsAt:null}});
 expect((await send(a.page,"/api/cycle/preferences",{action:"SHARE",shareWithCoach:false})).status).toBe(200);
 expect((await coachRead(c.page)).status).toBe(403);
 await a.ctx.close();await c.ctx.close();await o.ctx.close();
});
test("user exports own data and can revoke and erase all, without resurrecting old entries",async({browser})=>{
 const a=await browserAs(browser,"owner");await a.page.goto(host+"/cycle");
 const exported=await a.page.evaluate(async()=>{
  const r=await fetch("/api/privacy/export");return {status:r.status,data:await r.json(),cache:r.headers.get("cache-control")};
 });
 expect(exported.status).toBe(200);expect(exported.cache).toContain("no-store");
 expect(exported.data.cycleJournal.enabled).toBe(true);
 expect(exported.data.cycleJournal.entries[0].flow).toBe("LIGHT");
 const gone=await send(a.page,"/api/cycle/preferences",{action:"DISABLE",confirmDeletion:true});expect(gone.status).toBe(200);
 expect(gone.body.enabled).toBe(false);
 expect(await db.cycleJournalEntry.count({where:{userId:athlete.id}})).toBe(0);
 expect(await db.cyclePrivacy.count({where:{userId:athlete.id}})).toBe(0);
 const after=await a.page.evaluate(async()=>(await (await fetch("/api/cycle")).json()));
 expect(after.enabled).toBe(false);expect(after.entries).toHaveLength(0);
 const restart=await send(a.page,"/api/cycle/preferences",{action:"ENABLE",acknowledgeSensitiveData:true});
 expect(restart.status).toBe(200);expect(restart.body.entries).toHaveLength(0);
 expect(restart.body.shareWithCoach).toBe(false);
 expect(restart.body.lastPeriodStart).toBeNull();
 await a.ctx.close();
});
