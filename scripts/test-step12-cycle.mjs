import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import vm from "node:vm";
import ts from "typescript";
const require=createRequire(import.meta.url);
const code=ts.transpileModule(readFileSync("lib/cycle-contract.ts","utf8"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const module={exports:{}};
vm.runInNewContext("(function(require,module,exports){"+code+"\n})",{})(require,module,module.exports);
const {estimateCycle,validDateKey,entrySchema,preferenceSchema,dayPreference}=module.exports;
assert.equal(validDateKey("2026-02-29"),false);
assert.equal(validDateKey("2024-02-29"),true);
assert.equal(validDateKey("2026-13-01"),false);
assert.equal(validDateKey("2026-10-03"),true);
assert.equal(entrySchema.safeParse({date:"2026-10-04",symptoms:["CRAMPS","HEADACHE"],energy:2,flow:"LIGHT",planChoice:"REST"}).success,true);
assert.equal(entrySchema.safeParse({date:"2026-10-04",userId:"other",energy:2}).success,false);
assert.equal(entrySchema.safeParse({date:"2026-10-04",symptoms:["medical_secret"],energy:2}).success,false);
assert.equal(entrySchema.safeParse({date:"2026-10-04",energy:11}).success,false);
assert.equal(preferenceSchema.safeParse({action:"ENABLE"}).success,false,"Explicit sensitive consent required");
assert.equal(preferenceSchema.safeParse({action:"ENABLE",acknowledgeSensitiveData:true}).success,true);
assert.equal(preferenceSchema.safeParse({action:"DISABLE"}).success,false);
const start=new Date("2026-10-01T00:00:00.000Z");
const f=estimateCycle({lastPeriodStart:start,cycleLengthDays:28,today:"2026-10-22"});
assert.equal(f.day,22);assert.equal(f.estimatedNextStarts[0],"2026-10-29");
assert.equal(f.notForContraception,true);
assert.equal(estimateCycle({lastPeriodStart:start,cycleLengthDays:28,today:"2027-02-22"}),null,"stale calendar cannot predict");
assert.equal(estimateCycle({lastPeriodStart:start,cycleLengthDays:null,today:"2026-10-22"}),null);
assert.equal(estimateCycle({lastPeriodStart:start,cycleLengthDays:28,today:"2026-09-30"}),null);
assert.ok(dayPreference("REST").includes("unverändert"));
for(const [file,disallowed] of [["lib/recommendations.ts","cycleStartDate"],["app/api/athlete-context/route.ts","cycleStartDate:z.string()"]]){
 assert(!readFileSync(file,"utf8").includes(disallowed),file+" must not infer cycle-based fitness changes");
}
const schema=readFileSync("prisma/schema.prisma","utf8");
assert(schema.includes("privacy      CyclePrivacy @relation(fields:[userId],references:[userId],onDelete:Cascade)"),"Cascade must prevent orphan health data after revoke");
const coach=readFileSync("app/api/cycle/coach/[athleteId]/route.ts","utf8")+readFileSync("lib/cycle-service.ts","utf8");
for(const term of ["shareWithCoach","canCoachAccess","endsAt:{gt:now}","select:{date:true,planChoice:true,energy:true,discomfort:true}"]){
 assert(coach.includes(term),"Coach permission/field minimization must be explicit: "+term);
}
console.log("Step12 owner privacy, consent, calendar and no-score-impact checks passed.");
