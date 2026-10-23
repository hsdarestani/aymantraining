import {test,expect} from "@playwright/test";
import {PrismaClient} from "@prisma/client";
import {createHash} from "node:crypto";
test.skip(process.env.WOMEN_DASHBOARD_ENABLED!=="true","Step11 preview disabled");
const db=new PrismaClient(),host="http://127.0.0.1:3000",stamp=Date.now().toString(36);
let athleteA,athleteB,coach,tokens={};
async function session(user,label){
 const token="step11_"+label+"_"+stamp;tokens[label]=token;
 await db.authSession.create({data:{userId:user.id,tokenHash:createHash("sha256").update(token).digest("hex"),expiresAt:new Date(Date.now()+3600000)}});
}
async function login(browser,label){
 const ctx=await browser.newContext();
 await ctx.addCookies([{name:"bd_session",value:tokens[label],url:host,httpOnly:true,sameSite:"Lax"}]);
 return {ctx,page:await ctx.newPage()};
}
test.beforeAll(async()=>{
 if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Isolated test database only");
 athleteA=await db.user.create({data:{email:"step11a_"+stamp+"@example.invalid",role:"ATHLETE",sex:"female",passwordHash:"test",onboardingCompleted:true,subscriptionTier:"PRO"}});
 athleteB=await db.user.create({data:{email:"step11b_"+stamp+"@example.invalid",role:"ATHLETE",sex:"male",passwordHash:"test",onboardingCompleted:true,subscriptionTier:"FREE"}});
 coach=await db.user.create({data:{email:"step11coach_"+stamp+"@example.invalid",role:"COACH",passwordHash:"test"}});
 await db.journeyIntake.create({data:{userId:athleteA.id,selectedGoalSlugs:["athleticism","health"],selfLevel:"READY",dashboard:"WOMEN",status:"PENDING_PATHWAY"}});
 await Promise.all([[athleteA,"a"],[athleteB,"b"],[coach,"coach"]].map(([u,label])=>session(u,label)));
});
test.afterAll(async()=>{await db.$disconnect()});
test("onboarding-selected women layout remains voluntary and no cycle tracking is autoenabled",async({browser})=>{
 const {ctx,page}=await login(browser,"a");
 await page.goto(host+"/settings");
 await expect(page.getByRole("button",{name:"FRAUENANSICHT"})).toHaveAttribute("aria-pressed","true");
 const response=await page.evaluate(async()=> (await (await fetch("/api/dashboard-preference")).json()).preference);
 expect(response.mode).toBe("WOMEN");expect(response.source).toBe("onboarding");
 expect(response.cycleModuleEnabled).toBe(false);
 await page.goto(host+"/dashboard");
 await expect(page.getByRole("heading",{name:"STARK IN DEINEM TEMPO."})).toBeVisible();
 await expect(page.getByText(/Alle Sportarten stehen dir offen/)).toBeVisible();
 const localDay=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',day:'2-digit'}).format(new Date());
 await expect(page.getByRole('group',{name:'Trainingstag auswählen'}).getByRole('button',{name:new RegExp('HEUTE '+localDay+' ')})).toHaveAttribute('aria-pressed','true');
 await expect(page.getByText('ERHOLUNG IM PLAN',{exact:true})).toHaveCount(0);
 await expect(page.getByText('OHNE PLANUNG KEIN BESTÄTIGTER ERHOLUNGSTAG',{exact:true})).toBeVisible();
 await ctx.close();
});
test("preferences persist for one athlete without changing other users or earned progress",async({browser})=>{
 const a=await login(browser,"a"),b=await login(browser,"b");
 await a.page.goto(host+"/settings");
 await a.page.getByRole("button",{name:"ALLGEMEINE ANSICHT"}).click();
 await expect(a.page.getByRole("status")).toContainText("Ansicht gespeichert.");
 await a.page.goto(host+"/dashboard");
 await expect(a.page.getByRole("heading",{name:"STARK IN DEINEM TEMPO."})).toHaveCount(0);
 await a.page.goto(host+"/settings");
 await a.page.getByRole("button",{name:"FRAUENANSICHT"}).click();
 await expect(a.page.getByRole("status")).toContainText("Ansicht gespeichert.");
 await a.page.getByRole("checkbox",{name:/Trainerinnen bevorzugen/i}).check();
 await expect(a.page.getByRole("status")).toContainText("Ansicht gespeichert.");
 const pref=await a.page.evaluate(async()=> (await (await fetch("/api/dashboard-preference")).json()).preference);
 expect(pref.mode).toBe("WOMEN");expect(pref.presenterPreference).toBe("TRAINERIN");
 await b.page.goto(host+"/settings");
 await expect(b.page.getByRole("button",{name:"ALLGEMEINE ANSICHT"})).toHaveAttribute("aria-pressed","true");
 const other=await b.page.evaluate(async()=>(await (await fetch("/api/dashboard-preference")).json()).preference);
 expect(other.mode).toBe("GENERAL");expect(other.presenterPreference).toBe("ANY");
 expect(await db.journeyIntake.count({where:{userId:athleteA.id,dashboard:"WOMEN"}})).toBe(1);
 await a.ctx.close();await b.ctx.close();
});
test("invalid writes and coach writes are rejected; response is private",async({browser})=>{
 const a=await login(browser,"a"),c=await login(browser,"coach");
 await a.page.goto(host+"/settings");
 const invalid=await a.page.evaluate(async()=>{
  const r=await fetch("/api/dashboard-preference",{method:"POST",headers:{"content-type":"application/json"},
   body:JSON.stringify({mode:"WOMEN",presenterPreference:"ANY",userId:"someone-else"})});return r.status;
 });expect(invalid).toBe(422);
 await c.page.goto(host+"/login");
 const code=await c.page.evaluate(async()=>{
  const r=await fetch("/api/dashboard-preference",{method:"POST",headers:{"content-type":"application/json"},
   body:JSON.stringify({mode:"WOMEN",presenterPreference:"ANY"})});return r.status;
 });expect(code).toBe(403);
 const response=await a.page.evaluate(async()=>{
  const r=await fetch("/api/dashboard-preference");return r.headers.get("cache-control");
 });
 expect(response).toContain("private");expect(response).toContain("no-store");
 await a.ctx.close();await c.ctx.close();
});
