import {readFileSync} from "node:fs";
import {strict as assert} from "node:assert";
const sources=[
  "lib/gamification.ts",
  "app/api/score/route.ts",
  "app/api/digital-twin/route.ts",
  "lib/score-view.ts"
];
for(const file of sources){
 const code=readFileSync(file,"utf8");
 assert(!code.includes("levelForScore("),"BD Score must not award a training level in "+file);
 assert(!code.includes("levelForScore}"),"Score-level mapper must not be imported by "+file);
}
const game=readFileSync("lib/gamification.ts","utf8");
assert(game.includes("journeyLevelAward.findMany"),"Stage badges require recorded Journey awards");
assert(game.includes('awarded.has("TRULY_DIFFERENT")'),"Top-tier badge requires actual award");
assert(game.includes("confirmedLevel"),"Displayed gamification stage must use confirmed level");
const score=readFileSync("app/api/score/route.ts","utf8");
assert(score.includes("scoreIsLevel:false"),"Calculator response distinguishes raw score from level");
const twin=readFileSync("app/api/digital-twin/route.ts","utf8");
assert(twin.includes("profile.journey.confirmedLevel"),"Digital Twin must not infer level from score");
console.log("Step 10: all legacy score-derived level paths disabled.");
