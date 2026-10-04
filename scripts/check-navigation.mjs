import fs from "node:fs";
import path from "node:path";

const appRoot="app";
const publicRoots=new Set(["admin","legal","login","register","forgot-password","reset-password","onboarding","pricing"]);
const pages=[];

function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name).replaceAll("\\","/");
    if(entry.isDirectory())walk(full);
    else if(entry.name==="page.tsx")pages.push(full);
  }
}
walk(appRoot);

function guarded(page){
  const rel=page.slice("app/".length);
  const first=rel.split("/")[0];
  if(page==="app/page.tsx"||publicRoots.has(first))return true;
  let dir=path.posix.dirname(page);
  while(dir.startsWith("app/")){
    const layout=dir+"/layout.tsx";
    if(fs.existsSync(layout)){
      const text=fs.readFileSync(layout,"utf8");
      if(text.includes("MemberGuard"))return true;
    }
    const parent=path.posix.dirname(dir);
    if(parent===dir)break;
    dir=parent;
  }
  return false;
}

const missing=pages.filter(page=>!guarded(page));
const rootLayout=fs.readFileSync("mobile/app/_layout.tsx","utf8");
const tabsLayout=fs.readFileSync("mobile/app/(tabs)/_layout.tsx","utf8");
const nativeErrors=[];
if(!rootLayout.includes("<NativeChrome"))nativeErrors.push("mobile/app/_layout.tsx lädt NativeChrome nicht.");
if(!tabsLayout.includes("<Tabs"))nativeErrors.push("mobile/app/(tabs)/_layout.tsx enthält keine Hauptnavigation.");

if(missing.length||nativeErrors.length){
  console.error("Navigation ist nicht vollständig:");
  for(const page of missing)console.error("  Member Seite ohne MemberGuard: "+page);
  for(const error of nativeErrors)console.error("  "+error);
  process.exit(1);
}
console.log(`Navigation geprüft. ${pages.length} Web Seiten und Native Hauptnavigation sind abgesichert.`);
