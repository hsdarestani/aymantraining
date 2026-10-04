import fs from "node:fs";
import path from "node:path";
import base from "./app.json";

export default () => {
  const buildNumber=process.env.APP_BUILD_NUMBER||"1";
  const androidServices=path.join(__dirname,"firebase","google-services.json");
  const iosServices=path.join(__dirname,"firebase","GoogleService-Info.plist");
  const hasAndroidFirebase=fs.existsSync(androidServices);
  const hasIosFirebase=fs.existsSync(iosServices);
  const pushEnvironment=process.env.APPLE_PUSH_ENV||"development";
  const plugins=(base.expo.plugins||[]).map((plugin:any)=>{
    if(Array.isArray(plugin)&&plugin[0]==="expo-build-properties"){
      return [
        "expo-build-properties",
        {
          ...(plugin[1]||{}),
          ios:{
            ...((plugin[1]||{}).ios||{}),
            useFrameworks:"static"
          }
        }
      ];
    }
    return plugin;
  });
  if(hasAndroidFirebase||hasIosFirebase){
    plugins.push(
      ["@react-native-firebase/app",{ios:{disableSPM:true}}],
      "@react-native-firebase/messaging"
    );
  }
  return {
    ...base.expo,
    plugins,
    version:process.env.APP_VERSION_NAME||base.expo.version,
    ios:{
      ...base.expo.ios,
      buildNumber,
      ...(hasIosFirebase?{googleServicesFile:"./firebase/GoogleService-Info.plist"}:{}),
      ...(process.env.APPLE_TEAM_ID?{appleTeamId:process.env.APPLE_TEAM_ID}:{}),
      entitlements:{...(base.expo.ios as any).entitlements,"aps-environment":pushEnvironment}
    },
    android:{
      ...base.expo.android,
      versionCode:Math.max(1,Number(buildNumber)||1),
      ...(hasAndroidFirebase?{googleServicesFile:"./firebase/google-services.json"}:{})
    }
  };
};
