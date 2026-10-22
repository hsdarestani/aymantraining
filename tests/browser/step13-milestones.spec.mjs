import {test,expect} from "@playwright/test";
import {PrismaClient} from "@prisma/client";
import {createHash} from "node:crypto";
test.skip(process.env.MILESTONES_ENABLED!=="true","Milestone module not enabled");
const db=new PrismaClient(),host="http://127.0.0.1:3000",unique=Date.now().toString(36);
let athlete,other,coach,outsider;const sessions={};
async function user(role,label){
 const u=await db.user.create({data:{email:"step13"+label+unique+"@example.invalid",role,passwordHash:"test",onboardingCompleted:true}});
 const token=label+unique;sessions[label]=token;
 await db.authSession.create({data:{userId:u.id,tokenHash:createHash("sha256").update(token).digest("hex"),
  expiresAt:new Date(Date.now()+60*60*1000)}});return u;
}
async function as(browser,label){
 const ctx=await browser.newContext();
 await ctx.addCookies([{name:"bd_session",value:sessions[label],url:host,httpOnly:true,sameSite:"Lax"}]);
 const page=await ctx.newPage();
 await page.goto(host+"/dashboard");
 return {ctx,page};
}
async function req(page,method,path,body){
 return page.evaluate(async({method,path,body})=>{
  const r=await fetch(path,{method,headers:body===undefined?{}:{"content-type":"application/json"},
   body:body===undefined?undefined:JSON.stringify(body)});
  return {status:r.status,data:await r.json().catch(()=>null),cache:r.headers.get("cache-control")};
 },{method,path,body});
}
test.beforeAll(async()=>{
 if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Only isolated test database!");
 athlete=await user("ATHLETE","athlete");other=await user("ATHLETE","other");
 coach=await user("COACH","coach");outsider=await user("COACH","othercoach");
 await db.coachAssignment.create({data:{athleteId:athlete.id,coachId:coach.id,active:true}});
});
test.afterAll(async()=>{await db.$disconnect()});
test("no activity yields zero, app open does not fabricate progress",async({browser})=>{
 const a=await as(browser,"athlete");const p=await req(a.page,"GET","/api/milestones");
 expect(p.status).toBe(200);expect(p.data.streak).toBe(0);
 expect(p.data.awards).toHaveLength(0);
 expect(p.cache).toContain("private");
 await a.page.goto(host+"/milestones");
 await expect(a.page.getByRole("heading",{name:/JEDER TAG/})).toBeVisible();
 await a.ctx.close();
});
test("verified workout gives one first-step award on repeated queries; other athlete stays isolated",async({browser})=>{
 await db.workout.create({data:{userId:athlete.id,title:"Ein echtes Training",completedAt:new Date()}});
 const a=await as(browser,"athlete"),b=await as(browser,"other");
 const p=await req(a.page,"GET","/api/milestones");expect(p.status).toBe(200);
 expect(p.data.streak).toBe(1);
 expect(p.data.awards.filter(x=>x.key==="step13_first_workout")).toHaveLength(1);
 const again=await req(a.page,"GET","/api/milestones");
 expect(again.data.awards.filter(x=>x.key==="step13_first_workout")).toHaveLength(1);
 expect(await db.milestoneAward.count({where:{userId:athlete.id,key:"step13_first_workout"}})).toBe(1);
 expect((await req(b.page,"GET","/api/milestones")).data.awards).toHaveLength(0);
 await a.ctx.close();await b.ctx.close();
});
test("coach can configure own milestones and future recovery, not another coach",async({browser})=>{
 const c=await as(browser,"coach"),o=await as(browser,"othercoach"),a=await as(browser,"athlete");
 const key="coach_step13_1";const rule={athleteId:athlete.id,key,metric:"WORKOUT_COUNT",threshold:1,
  title:"DEIN ERSTER ERFOLG",message:"Ein echtes Training abgeschlossen.",
  visualIntensity:"SMALL",enabled:true};
 expect((await req(o.page,"POST","/api/milestones/coach",{action:"UPSERT_RULE",rule})).status).toBe(403);
 expect((await req(c.page,"POST","/api/milestones/coach",{action:"UPSERT_RULE",rule})).status).toBe(200);
 expect((await req(a.page,"GET","/api/milestones")).data.awards.some(x=>x.key===key)).toBe(true);
 expect((await req(c.page,"POST","/api/milestones/coach",{action:"PLAN_RECOVERY",plan:{
  athleteId:athlete.id,day:"2026-01-01"}})).status).toBe(422);
 const next=new Date(Date.now()+4*86400000).toISOString().slice(0,10);
 expect((await req(c.page,"POST","/api/milestones/coach",{action:"PLAN_RECOVERY",plan:{
  athleteId:athlete.id,day:next}})).status).toBe(200);
 expect(await db.plannedRecoveryDay.count({where:{athleteId:athlete.id}})).toBe(1);
 expect((await req(a.page,"GET","/api/milestones")).data.streak).toBe(1,"Future rest not counted today");
 expect((await req(c.page,"POST","/api/milestones/coach",{action:"REMOVE_RECOVERY",
  athleteId:athlete.id,day:next})).status).toBe(200);
 expect(await db.plannedRecoveryDay.count({where:{athleteId:athlete.id}})).toBe(0);
 await c.ctx.close();await o.ctx.close();await a.ctx.close();
});
