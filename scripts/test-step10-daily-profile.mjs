import {readFileSync} from "node:fs";
import {strict as assert} from "node:assert";
import ts from "typescript";
import vm from "node:vm";
const js=ts.transpileModule(readFileSync("lib/daily-profile.ts","utf8"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const mod={exports:{}};
vm.runInNewContext("(function(module,exports){"+js+"\n})",{ })(mod,mod.exports);
const {buildDailyProfile,localDateKey}=mod.exports;
const now=new Date("2026-10-22T23:30:00Z");
const base={now,timeZone:"Europe/Berlin",score:null,check:null,sleep:null,workouts:[],confirmedLevel:null};
const blank=buildDailyProfile(base);
assert.equal(blank.date,"2026-10-23");
assert.equal(blank.profile.value,null);
assert.equal(blank.today.readinessScore,null);
assert.equal(blank.plan.completionPercent,null);
assert.equal(blank.plan.status,"NOT_SCHEDULED");
assert.equal(blank.journey.confirmedLevel,null);
assert.ok(blank.today.missing.includes("SCHEDULE"));
assert.ok(blank.today.missing.includes("CHECK_IN"));
assert.ok(blank.today.missing.includes("SLEEP"));
assert.ok(blank.today.missing.includes("PROFILE_SCORE"));
assert.equal(localDateKey(new Date("2026-10-25T00:30:00Z"),"America/New_York"),"2026-10-24");
assert.equal(localDateKey(new Date("2026-10-25T00:30:00Z"),"Europe/Berlin"),"2026-10-25");
const recorded=buildDailyProfile({...base,
 score:{date:new Date("2026-10-02T00:00:00Z"),total:88,completeness:65},
 check:{energy:3,soreness:7,sleepHours:6.5},
 workouts:[{id:"w1",title:"Test workout",scheduledAt:new Date("2026-10-23T09:00:00Z"),completedAt:null},
 {id:"w2",title:"Done",scheduledAt:new Date("2026-10-23T10:00:00Z"),completedAt:new Date("2026-10-23T11:00:00Z")}],
 confirmedLevel:"READY"});
assert.equal(recorded.profile.value,88);
assert.equal(recorded.profile.freshness,"OLD");
assert.equal(recorded.profile.isToday,false);
assert.equal(recorded.plan.status,"PARTIAL");
assert.equal(recorded.plan.completionPercent,50);
assert.equal(recorded.today.energy,3);
assert.equal(recorded.today.sleepHours,6.5);
assert.equal(recorded.journey.confirmedLevel,"READY");
assert.equal(recorded.scoreIsLevel,false);
const emptyScore=buildDailyProfile({...base,score:{date:new Date("2026-10-23T00:00:00Z"),total:0,completeness:0}});
assert.equal(emptyScore.profile.value,null,"0 without coverage is not an observed score");
const done=buildDailyProfile({...base,workouts:[{id:"w1",title:"Done",scheduledAt:new Date("2026-10-23T09:00:00Z"),completedAt:now}]});
assert.equal(done.plan.status,"DONE");
assert.equal(done.plan.completionPercent,100);
assert.equal(done.journey.confirmedLevel,null);
console.log("Step 10 daily profile and separate earned-level contract passed.");
