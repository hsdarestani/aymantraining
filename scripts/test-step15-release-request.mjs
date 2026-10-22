import fs from "node:fs";
import assert from "node:assert/strict";
const req=JSON.parse(fs.readFileSync(new URL("../release-request.json",import.meta.url),"utf8"));
const app=JSON.parse(fs.readFileSync(new URL("../mobile/app.json",import.meta.url),"utf8")).expo;
assert.equal(req.app_identifier,"com.smarbiz.bedifferent");
assert.equal(req.source_branch,"main");
assert.equal(app.ios.bundleIdentifier,req.app_identifier);
assert.equal(app.android.package,req.app_identifier);
assert.equal(app.version,req.version_name,"Publisher must use the exact app version");
assert.equal(Number(app.ios.buildNumber),req.build_number,"iOS build number must match Publisher");
assert.equal(app.android.versionCode,req.build_number,"Android build number must match Publisher");
assert(req.build_number>20,"Do not reuse an already built version number");
assert(Array.isArray(req.platforms)&&req.platforms.length===2&&["ios","android"].every(x=>req.platforms.includes(x)));
assert.equal(req.android_track,"production");
assert.equal(req.auto_submit,true);
assert(req.release_notes?.length>100&&req.release_notes.length<2000);
assert(req.request_revision>=4);
if(process.argv.includes("--enabled"))assert.equal(req.enabled,true,"Release must explicitly be enabled");
const published=fs.readFileSync(new URL("../.github/workflows/publisher-release.yml",import.meta.url),"utf8");
for(const name of ["Product Quality Gate","Native App Check","Step 15 Release Acceptance","test-step15-release-request.mjs","BE DIFFERENT Step 08 Security"]){
 assert(published.includes(name),"Publisher is missing required release protection: "+name);
}
const legacy=fs.readFileSync(new URL("../.github/workflows/deploy.yml",import.meta.url),"utf8");
assert(legacy.includes("REFUSING DEPLOY"),"Unsafe shared-host standalone deployment must stay forbidden");
console.log("Step 15 release contract: app/store versions, platform IDs, exact source gates and isolated host protected.");
