import {test,expect} from "@playwright/test";
import {PrismaClient} from "@prisma/client";
import {createHash} from "node:crypto";
test.skip(process.env.CYCLE_JOURNAL_ENABLED!=="true","Private cycle module not enabled");
const db=new PrismaClient(),host="http://127.0.0.1:3000",stamp=Date.now().toString(36);
let owner,other,coach,outsider;const tokens={};
async function createSession(user,label){
 const token="step12_"+label+"_"+stamp;tokens[label]=token;
 await db.authSession.create({data:{userId:user.id,tokenHash:createHash("sha256").update(token).digest("hex"),expiresAt:new Date(Date.now()+3600000)}});
}
async function open(browser,label){
 const ctx=await browser.newContext();
 await ctx.addCookies([{name:"bd_session",value:tokens[label],url:host,httpOnly:true,sameSite:"Lax"}]);
 const page=await ctx.newPage();await page.goto(host+"/cycle");return {page,ctx};
}
async function request(page,path,method="GET",body){
 return page.evaluate(async({path,method,body})=>{
  const r=await fetch(path,{method,headers:body===undefined?{}:{"content-type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:r.status,data:await r.json().catch(()=>null),cache:r.headers.get("cache-control")};
 },{path,method,body});
}
test.beforeAll(async()=>{
 if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Isolated DB only");
 owner=await db.user.create({data:{email:"step12owner_"+stamp+"@example.invalid",role:"ATHLETE",sex:"female",passwordHash:"test",onboardingCompleted:true}});
 other=await db.user.create({data:{email:"step12other_"+stamp+"@example.invalid",role:"ATHLETE",sex:"male",passwordHash:"test",onboardingCompleted:true}});
 coach=await db.user.create({data:{email:"step12coach_"+stamp+"@example.invalid",role:"COACH",passwordHash:"test"}});
 outsider=await db.user.create({data:{email:"step12outsider_"+stamp+"@example.invalid",role:"COACH",passwordHash:"test"}});
 await db.coachAssignment.create({data:{athleteId:owner.id,coachId:coach.id}});
 await Promise.all([[owner,"owner"],[other,"other"],[coach,"coach"],[outsider,"outsider"]].map(([u,label])=>createSession(u,label)));
});
test.afterAll(async()=>{await db.$disconnect()});
test("no data or forecasts before explicit consent; malformed requests rejected",async({browser})=>{
 const a=await open(browser,"owner");
 const initial=await request(a.page,"/api/cycle");expect(initial.status).toBe(200);expect(initial.data.enabled).toBe(false);
 expect(initial.data.entries).toEqual([]);expect(initial.data.forecast).toBeNull();
 const before=await request(a.page,"/api/cycle/entries","PUT",{date:"2026-10-22",flow:"LIGHT"});
 expect(before.status).toBe(409);
 expect((await request(a.page,"/api/cycle/preferences","POST",{action:"ENABLE"})).status).toBe(422);
 const consent=await request(a.page,"/api/cycle/preferences","POST",{action:"ENABLE",acknowledgeSensitiveData:true});
 expect(consent.status).toBe(200);expect(consent.data.enabled).toBe(true);
 await expect(a.page.getByText("DEIN ZYKLUS. DEINE DATEN.")).toBeVisible();
 await a.ctx.close();
});
test("owner-only entry and training request, coach default denied, optional sharing scope",async({browser})=>{
 const a=await open(browser,"owner"),b=await open(browser,"other"),c=await open(browser,"coach"),o=await open(browser,"outsider");
 const day="2026-10-22";const entry={date:day,flow:"HEAVY",symptoms:["CRAMPS"],energy:4,mood:5,discomfort:7,planChoice:"EASIER"};
 expect((await request(a.page,"/api/cycle/entries","PUT",entry)).status).toBe(200);
 const privacy=await request(b.page,"/api/cycle");expect(privacy.data.entries).toEqual([]);
 expect((await request(c.page,"/api/cycle/coach/"+owner.id)).status).toBe(403);
 expect((await request(a.page,"/api/cycle/preferences","POST",{action:"SHARE",shareWithCoach:true})).status).toBe(422);
 const grant=await request(a.page,"/api/cycle/preferences","POST",{action:"SHARE",shareWithCoach:true,confirmShare:true});
 expect(grant.status).toBe(200);
 const shared=await request(c.page,"/api/cycle/coach/"+owner.id);
 expect(shared.status).toBe(200);expect(shared.data.entries[0].planChoice).toBe("EASIER");
 expect(shared.data.entries[0]).not.toHaveProperty("flow");expect(shared.data.entries[0]).not.toHaveProperty("symptoms");
 expect((await request(o.page,"/api/cycle/coach/"+owner.id)).status).toBe(403);
 const unauthorized=await request(b.page,"/api/cycle/coach/"+owner.id);expect(unauthorized.status).toBe(403);
 expect(privacy.cache).toContain("no-store");
 expect((await db.journeyEnrollment.count({where:{userId:owner.id}}))).toBe(0);
 await a.ctx.close();await b.ctx.close();await c.ctx.close();await o.ctx.close();
});
test("individual delete, export, revoke erase all rows, consent and sharing",async({browser})=>{
 const a=await open(browser,"owner"),c=await open(browser,"coach");
 const exported=await a.page.evaluate(async()=>{
  const r=await fetch("/api/privacy/export");return {json:await r.json(),cache:r.headers.get("cache-control")};
 });
 expect(exported.json.cycleJournal.enabled).toBe(true);
 expect(exported.json.cycleJournal.entries.some(e=>e.date==="2026-10-22")).toBe(true);
 expect(exported.cache).toContain("private");
 expect((await request(a.page,"/api/cycle/entries","DELETE",{date:"2026-10-22"})).status).toBe(200);
 expect(await db.cycleJournalEntry.count({where:{userId:owner.id}})).toBe(0);
 expect((await request(a.page,"/api/cycle/entries","PUT",{date:"2026-10-21",flow:"LIGHT",planChoice:"REST"})).status).toBe(200);
 const revoke=await request(a.page,"/api/cycle/preferences","POST",{action:"DISABLE",confirmDeletion:true});
 expect(revoke.status).toBe(200);expect(revoke.data.enabled).toBe(false);
 expect(await db.cyclePrivacy.count({where:{userId:owner.id}})).toBe(0);
 expect(await db.cycleJournalEntry.count({where:{userId:owner.id}})).toBe(0);
 expect((await request(c.page,"/api/cycle/coach/"+owner.id)).status).toBe(403);
 expect((await request(a.page,"/api/cycle/entries","PUT",{date:"2026-10-22"})).status).toBe(409);
 await a.ctx.close();await c.ctx.close();
});
