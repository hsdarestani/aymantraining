import {strict as assert} from "node:assert";
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
import vm from "node:vm";
import ts from "typescript";
const source=fs.readFileSync("lib/cycle-contract.ts","utf8");
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const module={exports:{}};
vm.runInNewContext("(function(require,module,exports){"+js+"\n})",{})(name=>{
 if(name==="zod")return require("zod");
 throw Error("Unknown dependency "+name);
},module,module.exports);
const x=module.exports;
assert.equal(x.validDateKey("2026-02-29"),false);
assert.equal(x.validDateKey("2024-02-29"),true);
assert.equal(x.entrySchema.safeParse({date:"2026-10-22",flow:"LIGHT",symptoms:["CRAMPS"],energy:6,mood:4,discomfort:0,planChoice:"REST"}).success,true);
assert.equal(x.entrySchema.safeParse({date:"2026-10-22",flow:"LIGHT",notes:"private extra field"}).success,false);
assert.equal(x.entrySchema.safeParse({date:"2026-10-22",symptoms:["HEADACHE","INVALID"]}).success,false);
assert.equal(x.preferenceSchema.safeParse({action:"ENABLE"}).success,false);
assert.equal(x.preferenceSchema.safeParse({action:"ENABLE",acknowledgeSensitiveData:true}).success,true);
assert.equal(x.preferenceSchema.safeParse({action:"SHARE",shareWithCoach:true,confirmShare:true}).success,true);
assert.equal(x.preferenceSchema.safeParse({action:"DISABLE"}).success,false);
const start=new Date("2026-10-01T00:00:00Z");
const forecast=x.estimateCycle({lastPeriodStart:start,cycleLengthDays:28,today:"2026-10-22"});
assert.equal(forecast.day,22);
assert.equal(forecast.estimatedNextStarts[0],"2026-10-29");
assert.equal(forecast.notForContraception,true);
assert.equal(x.estimateCycle({lastPeriodStart:start,cycleLengthDays:28,today:"2027-02-20"}),null);
assert.match(x.dayPreference("REST"),/unverändert/);
for(const path of ["lib/recommendations.ts","lib/scoring.ts","lib/journey-service.ts","lib/journey-reader.ts"]){
 const body=fs.readFileSync(path,"utf8");assert(!/cycleJournalEntry|cyclePrivacy|cycleStartDate|cycleTrackingEnabled/.test(body),
  "Sensitive cycle data must not flow into scores, unlocks or general coach recommendations: "+path);
}
console.log("Step12 isolated journal, explicit-consent schema, estimates and progression isolation passed.");
