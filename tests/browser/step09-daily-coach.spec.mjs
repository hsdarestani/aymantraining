import {test,expect} from "@playwright/test";
import {createHash} from "node:crypto";
import {PrismaClient} from "@prisma/client";
test.skip(process.env.JOURNEY_DAILY_ENABLED!=="true","Step09 preview disabled");
const db=new PrismaClient(),host="http://127.0.0.1:3000",stamp=Date.now().toString(36);
let athlete,coach,other,free,video,workout,tokens={};
async function session(user,label){
 const token="step09_"+label+"_"+stamp;tokens[label]=token;
 await db.authSession.create({data:{userId:user.id,tokenHash:createHash("sha256").update(token).digest("hex"),expiresAt:new Date(Date.now()+3600000)}});
}
async function asUser(browser,label){
 const context=await browser.newContext();await context.addCookies([{name:"bd_session",value:tokens[label],url:host,httpOnly:true,sameSite:"Lax"}]);
 return {context,page:await context.newPage()};
}
test.beforeAll(async()=>{
 if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Isolated PostgreSQL only");
 athlete=await db.user.create({data:{email:"step09athlete"+stamp+"@example.invalid",role:"ATHLETE",passwordHash:"test",onboardingCompleted:true,subscriptionTier:"PRO"}});
 free=await db.user.create({data:{email:"step09free"+stamp+"@example.invalid",role:"ATHLETE",passwordHash:"test",onboardingCompleted:true,subscriptionTier:"FREE"}});
 coach=await db.user.create({data:{email:"step09coach"+stamp+"@example.invalid",role:"COACH",passwordHash:"test"}});
 other=await db.user.create({data:{email:"step09other"+stamp+"@example.invalid",role:"COACH",passwordHash:"test"}});
 await db.coachAssignment.create({data:{athleteId:athlete.id,coachId:coach.id,active:true}});
 await Promise.all([[athlete,"athlete"],[coach,"coach"],[other,"other"],[free,"free"]].map(([u,l])=>session(u,l)));
 const scheduledAt=new Date(Date.now()+30*3600000);
 workout=await db.workout.create({data:{userId:athlete.id,title:"Technik nächste Einheit",scheduledAt}});
 video=await db.mediaAsset.create({data:{ownerId:athlete.id,relatedUserId:athlete.id,kind:"TECHNIQUE_VIDEO",
  originalName:"step09.mp4",mimeType:"video/mp4",sizeBytes:400,storageKey:"media/2026/step09-"+stamp}});
});
test.afterAll(async()=>{await db.$disconnect()});
test("daily dashboard uses real athlete schedule with no invented session",async({browser})=>{
 const {context,page}=await asUser(browser,"athlete");
 await page.goto(host+"/journey/today");
 await expect(page.getByRole("heading",{name:"Heute zählt, was wirklich ansteht."})).toBeVisible();
 await expect(page.getByText("Technik nächste Einheit")).toBeVisible();
 const raw=await page.evaluate(async()=>{const r=await fetch("/api/journey/daily");return {status:r.status,data:await r.json()}});
 expect(raw.status).toBe(200);expect(raw.data.actual.nextWorkout.id).toBe(workout.id);
 expect(raw.data.actual.energy).toBeNull();
 await context.close();
});
test("only athlete owner can submit video and only assigned coach can review it",async({browser})=>{
 const athleteBrowser=await asUser(browser,"athlete");
 await athleteBrowser.page.goto(host+"/journey/today");
 const out=await athleteBrowser.page.evaluate(async mediaId=>{
  const r=await fetch("/api/journey/videos",{method:"POST",headers:{"content-type":"application/json"},
   body:JSON.stringify({mediaId,message:"Bitte Technik der Kniebeuge kontrollieren"})});
  return {status:r.status,data:await r.json()};
 },video.id);
 expect(out.status).toBe(201);const id=out.data.id;
 const repeat=await athleteBrowser.page.evaluate(async mediaId=>{
  const r=await fetch("/api/journey/videos",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mediaId})});
  return r.status;
 },video.id);
 expect(repeat).toBe(409);
 const otherCoach=await asUser(browser,"other");
 await otherCoach.page.goto(host+"/admin/journey-videos");
 const otherQueue=await otherCoach.page.evaluate(async()=>{const r=await fetch("/api/admin/journey-videos");return await r.json()});
 expect(otherQueue.videos).toHaveLength(0);
 const denied=await otherCoach.page.evaluate(async id=>{
  const r=await fetch("/api/admin/journey-videos/"+id+"/review",{method:"POST",headers:{"content-type":"application/json"},
   body:JSON.stringify({coachNote:"Bitte deine Technik in der nächsten Einheit verbessern."})});return r.status;
 },id);
 expect(denied).toBe(403);
 const assigned=await asUser(browser,"coach");
 await assigned.page.goto(host+"/admin/journey-videos");
 await expect(assigned.page.getByText("Bitte Technik der Kniebeuge kontrollieren")).toBeVisible();
 await assigned.page.getByRole("textbox",{name:"Persönliches Feedback"}).fill("Achte auf kontrollierte Kniebewegung und stabile Rumpfmuskulatur.");
 await assigned.page.getByRole("combobox",{name:"Optionaler Bezug zur nächsten geplanten Einheit"}).selectOption(workout.id);
 await assigned.page.getByRole("textbox",{name:"Fokus"}).fill("Rumpfstabilität");
 await assigned.page.getByRole("textbox",{name:"Hinweise"}).fill("Beim nächsten Training drei Sätze langsam ausführen.");
 await assigned.page.getByRole("button",{name:"BEWERTUNG SPEICHERN"}).click();
 await expect(assigned.page.getByRole("status")).toContainText("Feedback gespeichert");
 const data=await athleteBrowser.page.evaluate(async()=>{const r=await fetch("/api/journey/daily");return (await r.json()).coach});
 expect(data.feedback[0].coachNote).toContain("Rumpfmuskulatur");
 expect(data.feedback[0].nextSession.focus).toBe("Rumpfstabilität");
 expect(await db.recommendation.count({where:{userId:athlete.id,sourceRule:"COACH_TECHNIQUE:"+id}})).toBe(1);
 expect((await db.workout.findUnique({where:{id:workout.id}})).notes).toBeNull();
 const same=await assigned.page.evaluate(async id=>{
  const r=await fetch("/api/admin/journey-videos/"+id+"/review",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({coachNote:"Nochmal bewertet"})});return r.status;
 },id);
 expect(same).toBe(409);
 await athleteBrowser.context.close();await assigned.context.close();await otherCoach.context.close();
});
test("FREE athlete and stranger cannot submit another person's private video",async({browser})=>{
 const {context,page}=await asUser(browser,"free");
 await page.goto(host+"/journey/today");
 const code=await page.evaluate(async mediaId=>{const r=await fetch("/api/journey/videos",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mediaId})});return r.status},video.id);
 expect(code).toBe(403);await context.close();
});
