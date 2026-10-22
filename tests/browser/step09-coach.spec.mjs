import {test,expect} from "@playwright/test";
import {PrismaClient} from "@prisma/client";
import {createHash} from "node:crypto";
test.skip(process.env.STEP09_ENABLED!=="true","Coach feature disabled");
const db=new PrismaClient(),base="http://127.0.0.1:3000",suffix=Date.now().toString(36);let athlete,coach,outsider,workout,video,session={};
async function cookie(user,label){
 const raw="s9-session-"+label+"-"+suffix;
 await db.authSession.create({data:{userId:user.id,tokenHash:createHash("sha256").update(raw).digest("hex"),expiresAt:new Date(Date.now()+86400000)}});
 session[label]=raw;
}
test.beforeAll(async()=>{
 if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Isolated DB only");
 athlete=await db.user.create({data:{email:"browser-s9-athlete"+suffix+"@example.invalid",passwordHash:"x",role:"ATHLETE",subscriptionTier:"PRO",onboardingCompleted:true}});
 coach=await db.user.create({data:{email:"browser-s9-coach"+suffix+"@example.invalid",passwordHash:"x",role:"COACH",onboardingCompleted:true}});
 outsider=await db.user.create({data:{email:"browser-s9-other"+suffix+"@example.invalid",passwordHash:"x",role:"COACH",onboardingCompleted:true}});
 await db.coachAssignment.create({data:{athleteId:athlete.id,coachId:coach.id,active:true}});
 workout=await db.workout.create({data:{userId:athlete.id,title:"Nächste Einheit",scheduledAt:new Date(Date.now()+86400000)}});
 video=await db.mediaAsset.create({data:{ownerId:athlete.id,relatedUserId:athlete.id,kind:"TECHNIQUE_VIDEO",storageKey:"media/browser-step09-"+suffix,originalName:"test.mp4",mimeType:"video/mp4",sizeBytes:50}});
 await cookie(athlete,"athlete");await cookie(coach,"coach");await cookie(outsider,"outsider");
});
test.afterAll(async()=>db.$disconnect());
async function browserAs(browser,label){
 const ctx=await browser.newContext();await ctx.addCookies([{name:"bd_session",value:session[label],url:base,httpOnly:true,sameSite:"Lax"}]);
 return {ctx,page:await ctx.newPage()};
}
test("dashboard gives grounded day state and coach assigns advice to the next workout",async({browser})=>{
 const {ctx:ac,page:ap}=await browserAs(browser,"athlete");
 await ap.goto(base+"/dashboard");
 await expect(ap.getByText("Heute keine Einheit geplant")).toBeVisible();
 await expect(ap.getByText("Noch kein Tagescheck")).toBeVisible();
 const submission=await ap.evaluate(async(mediaId)=>{
  const r=await fetch("/api/step09/technique",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mediaId})});
  return {status:r.status,data:await r.json()};
 },video.id);
 expect(submission.status).toBe(200);expect(submission.data.review.status).toBe("PENDING");
 const {ctx:cc,page:cp}=await browserAs(browser,"coach");
 await cp.goto(base+"/admin/technique-reviews");
 await expect(cp.getByText(athlete.email)).toBeVisible();
 await cp.getByRole("textbox",{name:"Persönliche Auswertung"}).fill("Die Schulter bleibt bei der Wiederholung zu weit vorne.");
 await cp.getByRole("textbox",{name:"Hinweis für die nächste Einheit (optional)"}).fill("Stabiler Rumpf und langsamer Ellenbogenweg im Aufwärmen.");
 await cp.getByRole("combobox",{name:"An welche geplante Einheit anheften?"}).selectOption(workout.id);
 await cp.getByRole("button",{name:"TRAINERANTWORT FREIGEBEN"}).click();
 await expect(cp.getByRole("status")).toContainText("gespeichert");
 await ap.reload();
 await expect(ap.getByText("Stabiler Rumpf und langsamer Ellenbogenweg im Aufwärmen.")).toBeVisible();
 const workoutApi=await ap.evaluate(async id=>{const r=await fetch("/api/workouts/"+id);return {status:r.status,data:await r.json()};},workout.id);
 expect(workoutApi.status).toBe(200);
 expect(workoutApi.data.coachCue.text).toMatch(/Ellenbogenweg/);
 await ac.close();await cc.close();
});
test("unassigned trainer and unauthenticated users cannot see private reviews",async({browser,request})=>{
 const {ctx,page}=await browserAs(browser,"outsider");
 await page.goto(base+"/admin/technique-reviews");
 await expect(page.getByText(athlete.email)).toHaveCount(0);
 const response=await request.get(base+"/api/step09/today");
 expect(response.status()).toBe(401);
 await ctx.close();
});
