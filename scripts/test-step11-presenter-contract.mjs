import fs from "node:fs";
import vm from "node:vm";
import {strict as assert} from "node:assert";
import ts from "typescript";

const js=ts.transpileModule(fs.readFileSync("lib/women-dashboard.ts","utf8"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const module={exports:{}};
vm.runInNewContext("(function(require,module,exports){"+js+"\n})",{})(()=>({prisma:{}}),module,module.exports);
const {sortPresenterVariants}=module.exports;
const items=[
 {presenter:"COACH",id:"coach",available:true},
 {presenter:"TRAINER",id:"trainer",available:false},
 {presenter:"TRAINER",id:"trainer2",available:true},
 {presenter:"COACH",id:"coach2",available:true}
];
assert.equal(sortPresenterVariants(items,"ANY").map(x=>x.id).join(","),"coach,trainer,trainer2,coach2");
assert.equal(sortPresenterVariants(items,"TRAINERIN").map(x=>x.id).join(","),"trainer,trainer2,coach,coach2");
assert.equal(items[0].id,"coach","Preference must not change the original media array");
assert.equal(sortPresenterVariants(items,"TRAINERIN").length,items.length,
 "Preference cannot add or delete access to any media variant");
assert.equal(sortPresenterVariants(items,"TRAINERIN")[0].available,false,
 "Ordering never changes actual entitlement status");
console.log("Step11: presenter preference is stable, metadata-only and preserves authorization.");
