import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import path from 'node:path';
const en=JSON.parse(fs.readFileSync('lib/i18n/en.json','utf8'));
assert.deepEqual(JSON.parse(fs.readFileSync('mobile/lib/i18n/en.json','utf8')),en,'Native and web catalogs must match');
for(const [key,value] of Object.entries(en)){assert(key.trim()===key&&key.length>0);assert(typeof value==='string'&&value.trim().length>0,`Empty translation ${key}`)}
for(const [key,expected] of [['SPEICHERN','SAVE'],['TRAINER','COACH'],['TAGESCHECK','DAILY CHECK-IN'],['ÜBUNGSBIBLIOTHEK','EXERCISE LIBRARY'],['AN TRAINER ÜBERGEBEN','HAND TO COACH'],['TRENNEN','DISCONNECT'],['Ungültige Anfrage.','Invalid request.']])assert.equal(en[key],expected);
const source=fs.readFileSync('lib/i18n/translate.ts','utf8');const js=ts.transpileModule(source.replace("import english from './en.json';",`const english=${JSON.stringify(en)};`),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {translate}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
assert.equal(translate(' SPEICHERN ','en'),' SAVE ');assert.equal(translate('SPEICHERN','de'),'SPEICHERN');assert.equal(translate('User-authored content','en'),'User-authored content');assert.equal(translate('Mary Smith','en'),'Mary Smith');
let files=0;function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory()){if(file!=='app/api')walk(file)}else if(file.endsWith('.tsx')){const content=fs.readFileSync(file,'utf8');if(content.includes('<Copy'))files++}}}walk('app');walk('mobile/app');assert(files>90,'Expected full platform copy wiring');
console.log(`LANGUAGE_TESTS_OK ${Object.keys(en).length} translations, ${files} localized screens/components`);
