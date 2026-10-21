import {test,expect} from "@playwright/test";
import {PrismaClient} from "@prisma/client";
import {createHash} from "node:crypto";

test.skip(process.env.JOURNEY_EDITOR_ENABLED!=="true","New coach curriculum editor requires the Step 05 isolated test flag.");
const db=new PrismaClient(),root="http://127.0.0.1:3000",stamp=Date.now().toString(36);
let admin,token;
test.beforeAll(async()=>{
 if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Isolated test database required.");
 admin=await db.user.create({data:{email:"journey-builder-"+stamp+"@example.invalid",
  name:"QA Coach",role:"ADMIN",passwordHash:"test"}});
 token="coach-editor-"+stamp;
 await db.authSession.create({data:{
  userId:admin.id,tokenHash:createHash("sha256").update(token).digest("hex"),expiresAt:new Date(Date.now()+3600000)
 }});
});
test.afterAll(async()=>{await db.$disconnect()});
test("coach creates a combined journey, edits level chapter, saves and reloads without unlocking anyone",async({page})=>{
 await page.context().addCookies([{name:"bd_session",value:token,url:root,httpOnly:true,sameSite:"Lax"}]);
 await page.goto(root+"/admin/journeys");
 await expect(page.getByRole("heading",{name:"Trainingswege & Kapitel"})).toBeVisible();
 const side=page.locator(".journey-create");
 await side.getByRole("textbox",{name:"Name"}).fill("QA Functional Movement "+stamp);
 await side.getByRole("checkbox",{name:"Fußball"}).uncheck();
 await side.getByRole("checkbox",{name:"Athletik"}).uncheck();
 await side.getByRole("checkbox",{name:"Muskelaufbau"}).uncheck();
 await side.getByRole("checkbox",{name:"Fettabbau"}).check();
 await side.getByRole("checkbox",{name:"Gesundheit"}).check();
 await side.getByRole("button",{name:"WEG ERSTELLEN"}).click();
 await expect(page.locator(".journey-sticky h2")).toContainText("QA Functional Movement");
 await expect(page.locator("details.journey-level")).toHaveCount(5);
 const ready=page.locator("details.journey-level").first();
 await ready.getByRole("button",{name:"KAPITEL HINZUFÜGEN"}).click();
 await expect(ready.locator(".journey-chapter")).toHaveCount(1);
 await ready.getByRole("button",{name:"+ Hinweis"}).click();
 await expect(ready.locator(".journey-item")).toHaveCount(1);
 await ready.locator(".journey-item").getByRole("textbox",{name:"Beschreibung / schriftliche Anleitung"}).fill("Langsam beginnen und Technik dokumentieren.");
 await ready.getByRole("button",{name:"+ Abschlusstest"}).click();
 await ready.locator(".journey-test").getByRole("textbox",{name:"Testname"}).fill("Bewegungstest Stufe READY");
 await ready.locator(".journey-test").getByRole("button",{name:"+ Kriterium"}).click();
 await ready.locator(".journey-test").getByRole("textbox",{name:"Messgröße"}).fill("movement_quality");
 await ready.locator(".journey-test").getByRole("checkbox",{name:/fachlich geprüft/}).check();
 await page.getByRole("button",{name:"SPEICHERN"}).click();
 await expect(page.getByRole("status")).toContainText("Entwurf gespeichert");
 await page.getByRole("button",{name:"Neu laden"}).click();
 await expect(ready.locator(".journey-test").getByRole("textbox",{name:"Messgröße"})).toHaveValue("movement_quality");
 const saved=await db.journeyPathway.findFirst({where:{titleDe:"QA Functional Movement "+stamp},
  include:{versions:{include:{levels:{include:{chapters:{include:{assessments:true}}}}}}}});
 expect(saved.versions[0].state).toBe("DRAFT");
 expect(saved.versions[0].levels.find(x=>x.code==="READY").chapters).toHaveLength(1);
 page.on("dialog",dialog=>dialog.accept());
 await page.getByRole("button",{name:"VERÖFFENTLICHEN"}).click();
 await expect(page.getByRole("alert")).toContainText("Mindestens ein Trainingskapitel");
});
test("an athlete cannot use coach curriculum APIs",async({request})=>{
 const list=await request.get(root+"/api/admin/journeys");
 expect(list.status()).toBe(401);
 const edit=await request.post(root+"/api/admin/journeys",{data:{titleDe:"Illegal",goals:["football"]}});
 expect(edit.status()).toBe(401);
});
