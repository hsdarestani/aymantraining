import fs from "node:fs";
import path from "node:path";

const root=path.resolve(process.cwd());
const firebaseDir=path.join(root,"firebase");
fs.mkdirSync(firebaseDir,{recursive:true});

function prepare(name,envName){
  const target=path.join(firebaseDir,name);
  const value=process.env[envName];
  if(value){
    fs.writeFileSync(target,Buffer.from(value,"base64"));
    console.log("Prepared "+name+" from build environment.");
    return true;
  }
  if(fs.existsSync(target)){
    console.log("Using committed "+name+".");
    return true;
  }
  return false;
}

const android=prepare("google-services.json","FIREBASE_ANDROID_GOOGLE_SERVICES_B64");
const ios=prepare("GoogleService-Info.plist","FIREBASE_IOS_GOOGLE_SERVICE_INFO_B64");

if(process.argv.includes("--require-android")&&!android){
  console.error("Android Firebase config is missing. Commit mobile/firebase/google-services.json or provide FIREBASE_ANDROID_GOOGLE_SERVICES_B64.");
  process.exit(2);
}
if(process.argv.includes("--require-ios")&&!ios){
  console.error("iOS Firebase config is missing. Commit mobile/firebase/GoogleService-Info.plist or provide FIREBASE_IOS_GOOGLE_SERVICE_INFO_B64.");
  process.exit(2);
}
