import fs from "node:fs";
import path from "node:path";
import base from "./app.json";

export default () => {
  const buildNumber=process.env.APP_BUILD_NUMBER||"1";
  const androidServices=path.join(__dirname,"firebase","google-services.json");
  const iosServices=path.join(__dirname,"firebase","GoogleService-Info.plist");
  const pushEnvironment=process.env.APPLE_PUSH_ENV||"development";
  return {
    ...base.expo,
    version:process.env.APP_VERSION_NAME||base.expo.version,
    ios:{
      ...base.expo.ios,
      buildNumber,
      ...(fs.existsSync(iosServices)?{googleServicesFile:"./firebase/GoogleService-Info.plist"}:{}),
      ...(process.env.APPLE_TEAM_ID?{appleTeamId:process.env.APPLE_TEAM_ID}:{}),
      entitlements:{...(base.expo.ios as any).entitlements,"aps-environment":pushEnvironment}
    },
    android:{
      ...base.expo.android,
      versionCode:Math.max(1,Number(buildNumber)||1),
      ...(fs.existsSync(androidServices)?{googleServicesFile:"./firebase/google-services.json"}:{})
    }
  };
};
