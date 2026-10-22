import {test,expect} from "@playwright/test";
import {PrismaClient} from "@prisma/client";
import {createHash} from "node:crypto";
test.skip(process.env.CELEBRATIONS_ENABLED!=="true","Celebrations feature disabled");
test.describe.configure({mode:"serial"});
const db=new PrismaClient(),host="http://127.0.0.1:3000",stamp=Date.now().toString(36);
let athlete,other,coach,fullAward;const tokens={};
async function user(role,label){
 const u=await db.user.create({data:{email:"step14"+label+stamp+"@example.invalid",role,
  passwordHash:"test",onboardingCompleted:true}});
 const token="step14_"+label+"_"+stamp;tokens[label]=token;
 await db.authSession.create({data:{userId:u.id,tokenHash:createHash("sha256").update(token).digest("hex"),
  expiresAt:new Date(Date.now()+3600000)}});
 return u;
}
async function open(browser,label,pathname="/milestones"){
 const ctx=await browser.newContext();
 await ctx.addCookies([{name:"bd_session",value:tokens[label],url:host,httpOnly:true,sameSite:"Lax"}]);
 const page=await ctx.newPage();await page.goto(host+pathname);
 return {page,ctx};
}
async function req(page,path,method="GET",body){
 return page.evaluate(async({path,method,body})=>{
  const res=await fetch(path,{method,headers:body===undefined?{}:{"content-type":"application/json"},
   body:body===undefined?undefined:JSON.stringify(body)});
  return {status:res.status,body:await res.json().catch(()=>null),cache:res.headers.get("cache-control")};
 },{path,method,body});
}
test.beforeAll(async()=>{
 if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Isolated DB only");
 athlete=await user("ATHLETE","a");other=await user("ATHLETE","b");coach=await user("COACH","c");
 await db.workout.create({data:{userId:athlete.id,title:"Erster geprüfter Erfolg",completedAt:new Date()}});
 await db.workout.create({data:{userId:other.id,title:"Nur für andere Person",completedAt:new Date()}});
 await db.milestoneRule.create({data:{athleteId:athlete.id,coachId:coach.id,key:"coach_step14_special",
  metric:"WORKOUT_COUNT",threshold:1,title:"EIN BESONDERER ERFOLG",
  message:"Ein bestätigtes Training hat dein persönliches Ziel erfüllt.",visualIntensity:"FULL",enabled:true}});
});
test.afterAll(async()=>{await db.$disconnect()});
test("real completed workout creates personal achievement, no foreign acknowledgement",async({browser})=>{
 const a=await open(browser,"a"),b=await open(browser,"b"),c=await open(browser,"c","/login");
 const own=await req(a.page,"/api/celebrations");
 expect(own.status).toBe(200);expect(own.cache).toContain("private");
 fullAward=own.body.pending.find(x=>x.intensity==="FULL");
 expect(fullAward?.title).toBe("EIN BESONDERER ERFOLG");
 const otherAward=(await req(b.page,"/api/celebrations")).body.pending[0];
 expect(otherAward.id).not.toBe(fullAward.id);
 expect((await req(b.page,"/api/celebrations","POST",{action:"ACKNOWLEDGE",awardId:fullAward.id})).status).toBe(404);
 expect((await req(a.page,"/api/celebrations","POST",{action:"ACKNOWLEDGE",awardId:fullAward.id,
  userId:other.id})).status).toBe(422);
 expect((await req(c.page,"/api/celebrations")).status).toBe(403);
 expect(await db.milestoneAward.count({where:{userId:athlete.id,key:"coach_step14_special"}})).toBe(1);
 await a.ctx.close();await b.ctx.close();await c.ctx.close();
});
test("accessible celebration dialog, controls and system reduced motion",async({browser})=>{
 const {page,ctx}=await open(browser,"a","/dashboard");
 await expect(page.getByRole("dialog")).toBeVisible();
 await expect(page.getByRole("dialog").getByRole("button",{name:"WEITER"})).toBeVisible();
 await page.emulateMedia({reducedMotion:"reduce"});
 const dialog=page.getByRole("dialog");
 await expect(dialog).toHaveClass(/bd-celebration-still/);
 await expect(dialog.locator(".bd-celebration-symbol")).toHaveCSS("animation-name","none");
 await dialog.getByRole("button",{name:"WEITER"}).click();
 await expect(page.getByRole("dialog")).toBeVisible(); // Another independently earned milestone queued
 await page.keyboard.press("Escape");
 const pending=await req(page,"/api/celebrations");
 expect(pending.body.pending.length).toBeLessThanOrEqual(1);
 await ctx.close();
});
test("user can turn off celebrations without deleting achievements and reenable without motion",async({browser})=>{
 const {page,ctx}=await open(browser,"a","/settings");
 const area=page.getByRole("region",{name:"Erfolgserlebnisse"});
 await expect(area).toBeVisible();
 await area.getByRole("checkbox",{name:"Erfolgsanzeigen automatisch öffnen"}).uncheck();
 await expect(area.getByRole("status")).toContainText("Einstellung gespeichert.");
 const disabled=await req(page,"/api/celebrations");
 expect(disabled.body.preference.enabled).toBe(false);
 expect(disabled.body.pending).toHaveLength(0);
 const count=await db.milestoneAward.count({where:{userId:athlete.id}});
 expect(count).toBeGreaterThan(0);
 await area.getByRole("checkbox",{name:"Erfolge ohne bewegte Effekte anzeigen"}).check();
 await expect(area.getByRole("status")).toContainText("Einstellung gespeichert.");
 await area.getByRole("checkbox",{name:"Erfolgsanzeigen automatisch öffnen"}).check();
 await expect(area.getByRole("status")).toContainText("Einstellung gespeichert.");
 const enabled=await req(page,"/api/celebrations");
 expect(enabled.body.preference).toEqual({enabled:true,reduceMotion:true});
 expect((await req(page,"/api/celebrations","POST",{action:"ACKNOWLEDGE",awardId:fullAward.id})).status).toBe(200);
 expect((await req(page,"/api/celebrations","POST",{action:"ACKNOWLEDGE",awardId:fullAward.id})).status).toBe(200);
 expect(await db.milestoneAward.count({where:{userId:athlete.id,key:"coach_step14_special"}})).toBe(1);
 await ctx.close();
});
