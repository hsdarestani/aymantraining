import fs from "node:fs";

const file=new URL("../android/app/build.gradle",import.meta.url);
let source=fs.readFileSync(file,"utf8");

function matchBrace(text,openIndex){
  let depth=0;
  for(let i=openIndex;i<text.length;i++){
    if(text[i]==="{")depth++;
    else if(text[i]==="}"){
      depth--;
      if(depth===0)return i;
    }
  }
  throw new Error("Unbalanced Gradle block");
}
function block(name,from=0){
  const start=source.indexOf(name,from);
  if(start<0)throw new Error("Missing "+name+" block");
  const open=source.indexOf("{",start);
  return {start,open,end:matchBrace(source,open)};
}

const signing=block("signingConfigs");
const releaseConfig=`
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
`;
if(!source.slice(signing.open,signing.end).includes("System.getenv(\"ANDROID_KEYSTORE_PATH\")")){
  source=source.slice(0,signing.end)+releaseConfig+source.slice(signing.end);
}

const buildTypes=block("buildTypes");
const releaseStart=source.indexOf("release {",buildTypes.open);
if(releaseStart<0||releaseStart>buildTypes.end)throw new Error("Missing release buildType");
const releaseOpen=source.indexOf("{",releaseStart);
const releaseEnd=matchBrace(source,releaseOpen);
let releaseBody=source.slice(releaseStart,releaseEnd+1);
if(/signingConfig\s+signingConfigs\.debug/.test(releaseBody)){
  releaseBody=releaseBody.replace(/signingConfig\s+signingConfigs\.debug/g,"signingConfig signingConfigs.release");
}else if(!/signingConfig\s+signingConfigs\.release/.test(releaseBody)){
  releaseBody=releaseBody.replace("release {","release {\n            signingConfig signingConfigs.release");
}
source=source.slice(0,releaseStart)+releaseBody+source.slice(releaseEnd+1);
fs.writeFileSync(file,source);
console.log("Android release signing configured from agent environment.");
