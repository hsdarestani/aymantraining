import base from "./app.json";

export default () => {
  const buildNumber = process.env.APP_BUILD_NUMBER || "1";
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "";
  return {
    ...base.expo,
    version: process.env.APP_VERSION_NAME || base.expo.version,
    ios: {
      ...base.expo.ios,
      buildNumber,
      ...(process.env.APPLE_TEAM_ID ? { appleTeamId: process.env.APPLE_TEAM_ID } : {})
    },
    android: {
      ...base.expo.android,
      versionCode: Math.max(1, Number(buildNumber) || 1)
    },
    extra: {
      ...base.expo.extra,
      ...(projectId ? { eas: { projectId } } : {})
    }
  };
};
