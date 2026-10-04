import assert from 'node:assert/strict';import fs from 'node:fs/promises';import ts from 'typescript';
const source=await fs.readFile('mobile/lib/health-values.ts','utf8');const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const h=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
assert.equal(h.sumValues([{energy:{inKilocalories:40}},{energy:{inKilocalories:60}}],'energy'),100);
assert.equal(h.latestValue([{time:'2026-10-04T02:00:00Z',weight:{inKilograms:80}},{time:'2026-10-04T01:00:00Z',weight:{inKilograms:79}}],'weight'),80);
assert.equal(h.sumValues([]),undefined);assert.equal(h.numeric(NaN),undefined);
assert.equal(h.sleepDuration([{start:'2026-10-03T22:00:00Z',end:'2026-10-04T06:00:00Z'},{start:'2026-10-03T23:00:00Z',end:'2026-10-04T01:00:00Z'}]),480);
assert.equal(h.localDay(new Date(2026,9,5,0,30)),'2026-10-05');assert.equal(h.localDayStart(new Date(2026,9,5,14,30)).getHours(),0);
console.log('HEALTH_NORMALIZATION_TESTS_OK');
