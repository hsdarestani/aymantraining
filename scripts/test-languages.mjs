import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import path from 'node:path';
const en=JSON.parse(fs.readFileSync('lib/i18n/en.json','utf8'));
assert.deepEqual(JSON.parse(fs.readFileSync('mobile/lib/i18n/en.json','utf8')),en,'Native and web catalogs must match');
for(const [key,value] of Object.entries(en)){assert(key.trim()===key&&key.length>0);assert(typeof value==='string'&&value.trim().length>0,`Empty translation ${key}`)}
for(const [key,expected] of [['SPEICHERN','SAVE'],['TRAINER','COACH'],['TAGESCHECK','DAILY CHECK-IN'],['ÜBUNGSBIBLIOTHEK','EXERCISE LIBRARY'],['AN TRAINER ÜBERGEBEN','HAND TO COACH'],['TRENNEN','DISCONNECT'],['Ungültige Anfrage.','Invalid request.'],['GUTEN MORGEN','GOOD MORNING'],['HEUTE WICHTIG','IMPORTANT TODAY'],['ZYKLUS KONTEXT','CYCLE CONTEXT'],['AN','ON']])assert.equal(en[key],expected);
const source=fs.readFileSync('lib/i18n/translate.ts','utf8');const js=ts.transpileModule(source.replace("import english from './en.json';",`const english=${JSON.stringify(en)};`),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {translate}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
assert.equal(translate(' SPEICHERN ','en'),' SAVE ');assert.equal(translate('SPEICHERN','de'),'SPEICHERN');assert.equal(translate('User-authored content','en'),'User-authored content');assert.equal(translate('Mary Smith','en'),'Mary Smith');
assert.equal(translate('Training 2 von 3','en'),'Workouts 2 of 3');assert.equal(translate('Owner $& plan · Tag 2','en'),'Owner $& plan · Day 2');assert.equal(translate('Schlaf im Schnitt 7.5 Stunden','en'),'Average sleep 7.5 hours');assert.equal(translate('2 Übungen importiert · 1 Hinweise.','en'),'2 exercises imported · 1 notices.');
assert.equal(translate('REGENERATION Keine Angabe','en'),'RECOVERY No data');
assert.equal(translate('REGENERATION 0','en'),'RECOVERY 0');
assert.equal(translate('REGENERATION 85','de'),'REGENERATION 85');
assert.equal(translate('AUSGANGSWERT','en'),'BASELINE');
assert.equal(translate('Entwurf gespeichert.','en'),'Draft saved.');
assert.equal(translate('Test bestanden: Level AWAKE freigeschaltet.','en'),'Test passed: level AWAKE unlocked.');
assert.equal(translate('READY / Owner $& chapter: Ein fachlich freigegebener Abschlusstest ist erforderlich. | AWAKE: Mindestens ein Trainingskapitel erforderlich.','en'),'READY / Owner $& chapter: A coach-approved chapter test is required. | AWAKE: At least one training chapter is required.');
let files=0;function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory()){if(file!=='app/api')walk(file)}else if(file.endsWith('.tsx')){const content=fs.readFileSync(file,'utf8');if(content.includes('<Copy'))files++}}}walk('app');walk('mobile/app');assert(files>90,'Expected full platform copy wiring');
console.log(`LANGUAGE_TESTS_OK ${Object.keys(en).length} translations, ${files} localized screens/components`);

const localeProvider=fs.readFileSync('app/components/Locale.tsx','utf8');
assert(localeProvider.includes('router.refresh()'),'Web locale switch must refresh server-rendered surfaces');
assert(localeProvider.includes('useEffect(()=>{update(initialLocale)'),'Web locale provider must resync after server refresh');
const rawChecks=[
 ['app/dashboard/page.tsx',['>HEUTE WICHTIG<','>DEINE 72 STUNDEN<','>BELASTUNG IM BLICK.<','>ERLEDIGT<','>HEUTIGES TRAINING<']],
 ['mobile/app/(tabs)/index.tsx',['>HEUTE WICHTIG<','>BELASTUNG IM BLICK.<','>ERLEDIGT<','>HEUTIGES TRAINING<','>Atmung und Tagescheck<']],
 ['mobile/app/(tabs)/athlete.tsx',['>MEHR<','>ABMELDEN<']]
];
for(const [file,needles] of rawChecks){const content=fs.readFileSync(file,'utf8');for(const needle of needles)assert(!content.includes(needle),`Unlocalized visible copy in ${file}: ${needle}`)}


// Regression coverage: the language picker must never leave fixed labels or
// the guided breathing narration in German after English is selected.
const focusNative=fs.readFileSync('mobile/app/focus.tsx','utf8');
const focusWeb=fs.readFileSync('app/focus/FocusTimer.tsx','utf8');
const focusPage=fs.readFileSync('app/focus/page.tsx','utf8');
const picker=fs.readFileSync('mobile/components/Locale.tsx','utf8');
assert(focusNative.includes('Speech.speak(translate(text)'), 'Native narration must translate cues');
assert(focusNative.includes('currentLocale()==="en"?"en-US":"de-DE"'), 'Native narration must select the correct spoken language');
assert(focusWeb.includes('SpeechSynthesisUtterance(translate(message,localeRef.current))'), 'Web narration must translate cues');
assert(focusWeb.includes('localeRef.current==="en"?"en-US":"de-DE"'), 'Web narration must select its voice language');
assert(focusPage.includes('<Copy text="DEIN MOMENT."/>'), 'Web focus headline must use the catalog');
assert(focusNative.includes('<Copy text="ATEMTRAINING"/>'), 'Native exercise label must be localized');
assert(picker.includes("{locale==='de'?'DE':'EN'}"), 'Language action should show the currently selected language');
for(const [key,expected] of [['DEIN MOMENT.','YOUR MOMENT.'],['DEIN FOKUS.','YOUR FOCUS.'],['ATEMTRAINING','BREATHING EXERCISE'],['STARTEN','START'],['SPRACHBEGLEITUNG EINSCHALTEN','ENABLE VOICE GUIDANCE']]){
 assert.equal(translate(key,'en'),expected,`Missing breathing translation: ${key}`);
}
// Catch newly introduced untranslated literal <Copy> labels on native routes,
// including nested tabs, before they reach Android/iOS releases.
const nativeRoots=['mobile/app','mobile/components/Brand.tsx','mobile/components/LaunchIntro.tsx','mobile/components/NativeChrome.tsx','mobile/components/MilestoneCelebration.tsx','mobile/components/RhythmHorizon.tsx'];
let inspected=0;
function checkCopyLiterals(file){
 const source=fs.readFileSync(file,'utf8');
 for(const match of source.matchAll(/<Copy\s+text=(?:"([^"]+)"|'([^']+)'|\{["']([^"']+)["']\})/g)){
  const literal=match[1]||match[2]||match[3];
  assert(Object.prototype.hasOwnProperty.call(en,literal),`Missing English translation in ${file}: ${literal}`);
  inspected++;
 }
}
for(const root of nativeRoots){
 if(fs.statSync(root).isFile()){checkCopyLiterals(root);continue}
 function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())visit(file);else if(file.endsWith('.tsx'))checkCopyLiterals(file);
 }}visit(root);
}
for(const file of ['app/focus/page.tsx','app/components/RhythmHorizon.tsx']){
 const source=fs.readFileSync(file,'utf8');
 assert(!source.includes('>DEIN FOKUS.</em>'),'Web focus surfaces must not contain raw German headings');
}
for(const file of ['app/journey/JourneyOverview.tsx','app/journey/today/TodayClient.tsx']){
 assert(fs.readFileSync(file,'utf8').trimStart().startsWith('"use client";'),'Localized interactive pages must retain client boundaries');
}
assert(inspected>400,'Language coverage scan did not find expected native copy literals');
console.log(`LANGUAGE_COVERAGE_OK ${inspected} native copy literals validated`);

// Fixed production labels must participate in language changes, including new
// journey, cycle and coach pages; user-authored content is deliberately excluded.
let fixedWebLabels=0;
function checkWebLabels(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 const file=path.join(dir,entry.name);
 if(entry.isDirectory()){if(!['api','prototype','legal'].includes(entry.name))checkWebLabels(file);continue}
 if(!file.endsWith('.tsx')||file==='app/components/Locale.tsx')continue;
 const source=fs.readFileSync(file,'utf8');
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 function inspect(node){
  if(ts.isJsxText(node)){
   const value=node.text.replace(/\s+/g,' ').trim();
   if(value&&Object.hasOwn(en,value))assert.fail(`Fixed label bypasses locale provider in ${file}: ${value}`);
  }
  if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(ast)==='Copy'){
   const attr=node.attributes.properties.find(x=>ts.isJsxAttribute(x)&&x.name.getText(ast)==='text');
   let value=attr?.initializer;
   if(value&&ts.isJsxExpression(value))value=value.expression;
   if(value&&ts.isStringLiteral(value)){
    assert(Object.hasOwn(en,value.text.trim()),`Missing fixed web translation in ${file}: ${value.text}`);fixedWebLabels++;
   }
  }
  ts.forEachChild(node,inspect);
 }inspect(ast);
}}
checkWebLabels('app');
assert(fixedWebLabels>400,'Production web language scan is incomplete');
for(const file of ['app/onboarding/page.tsx','app/cycle/CycleClient.tsx','app/admin/journeys/JourneyBuilder.tsx']){
 const source=fs.readFileSync(file,'utf8');
 assert(!source.includes('>{g.label}<')&&!source.includes('>{level.description}<'),'Preset labels must translate in '+file);
}
console.log(`WEB_LANGUAGE_COVERAGE_OK ${fixedWebLabels} fixed labels checked`);
