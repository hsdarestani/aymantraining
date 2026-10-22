import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import {strict as assert} from "node:assert";
import vm from "node:vm";
import ts from "typescript";
const require=createRequire(import.meta.url);
const compiled=ts.transpileModule(readFileSync("lib/milestone-contract.ts","utf8"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const mod={exports:{}};
vm.runInNewContext("(function(require,module,exports){"+compiled+"\n})",{})(require,mod,mod.exports);
const {calculateStreak,addDays,validDay,recoverySchema,ruleSchema}=mod.exports;
assert.equal(validDay("2026-02-29"),false);
assert.equal(validDay("2024-02-29"),true);
const w=(day,id="w")=>({day,kind:"WORKOUT",sourceId:id});
const c=(day)=>({day,kind:"CHECKIN",sourceId:"c"});
const rest=(day)=>({day,kind:"RECOVERY",sourceId:"coach-plan"});
const t="2026-10-22";
assert.equal(calculateStreak(t,[]).streak,0);
assert.equal(calculateStreak(t,[w("2026-10-21")]).streak,1,"Today's incomplete day is grace until midnight");
assert.equal(calculateStreak(t,[w("2026-10-20")]).streak,0);
assert.equal(calculateStreak(t,[w(t),w(t),c(t)]).eligibleDays,1,"Only one event per day");
assert.equal(calculateStreak(t,[w("2026-10-20"),rest("2026-10-21"),w(t)]).streak,3);
assert.equal(calculateStreak(t,[w("2026-10-20"),rest("2026-10-21"),w(t)],[{day:"2026-10-21",sourceId:"scheduled"}]).streak,1,
 "A coach rest day cannot conceal a scheduled uncompleted workout");
const d=Array.from({length:35},(_,i)=>w(addDays(t,-i),"w"+i));
assert.equal(calculateStreak(t,d).streak,35);
assert.equal(calculateStreak(t,d).best,35);
const rerun=calculateStreak(t,d.concat(d));
assert.equal(rerun.eligibleDays,35,"Sync replay must not double count");
assert.equal(calculateStreak(t,[rest(addDays(t,1))]).streak,0,"Future rest not counted");
assert.equal(recoverySchema.safeParse({athleteId:"123",day:"2026-02-29"}).success,false);
assert.equal(ruleSchema.safeParse({athleteId:"123",key:"coach_7days",metric:"STREAK_DAYS",threshold:7,title:"Eine Woche",message:"Echte Schritte",visualIntensity:"SMALL"}).success,true);
assert.equal(ruleSchema.safeParse({athleteId:"123",key:"coach_7days",metric:"SCORE",threshold:7,title:"Eine Woche",message:"Echte Schritte",visualIntensity:"SMALL"}).success,false);
for(const file of ["lib/milestone-service.ts","lib/milestone-contract.ts"]){
 const source=readFileSync(file,"utf8");
 assert(!source.includes("app_open"),"App opens must never grant streaks");
 assert(!/cycleJournalEntry|cyclePrivacy|cycleStartDate/.test(source),"Sensitive cycle data excluded");
}
assert(readFileSync("prisma/schema.prisma","utf8").includes("@@unique([userId,key])"),
 "Award keys must be idempotent");
console.log("Step 13 verified day, rest, DST-key, late replay and milestone policy passed.");
