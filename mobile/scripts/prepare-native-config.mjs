import fs from "node:fs";
import path from "node:path";

const root=path.resolve(process.cwd());
const firebaseDir=path.join(root,"firebase");
fs.mkdirSync(firebaseDir,{recursive:true});

function write(name,envName){
  const value=process.env[envName];
  if(!value)return false;
  const target=path.join(firebaseDir,name);
  fs.writeFileSync(target,Buffer.from(value,"base64"));
  console.log("Prepared "+name);
  return true;
}
const android=write("google-services.json","FIREBASE_ANDROID_GOOGLE_SERVICES_B64");
const ios=write("GoogleService-Info.plist","FIREBASE_IOS_GOOGLE_SERVICE_INFO_B64");

if(process.argv.includes("--require-android")&&!android){
  console.error("FIREBASE_ANDROID_GOOGLE_SERVICES_B64 is required for Android production builds.");
  process.exit(2);
}
if(process.argv.includes("--require-ios")&&!ios){
  console.error("FIREBASE_IOS_GOOGLE_SERVICE_INFO_B64 is required for iOS production builds.");
  process.exit(2);
}
