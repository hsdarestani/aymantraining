// Android 15/16 three-button navigation can draw a bright contrast scrim across
// an edge-to-edge tab bar. Keep system buttons light and the app area dark.
// This is a build-time style change; it does not hide the Android system bar.
const {withAndroidStyles}=require("@expo/config-plugins");

module.exports=function withAndroidNavigationContrast(config){
 return withAndroidStyles(config,(cfg)=>{
  const appTheme=(cfg.modResults.resources.style||[]).find(s=>s.$?.name==="AppTheme");
  if(!appTheme)throw new Error("AppTheme not found; cannot configure Android navigation contrast safely");
  appTheme.item=appTheme.item||[];
  const set=(name,value)=>{
   const existing=appTheme.item.find(i=>i.$?.name===name);
   if(existing)existing._=value;
   else appTheme.item.push({$:{name},_:value});
  };
  // Contrast scrim is the light grey band in three-button Android navigation.
  set("android:enforceNavigationBarContrast","false");
  set("android:windowLightNavigationBar","false");
  set("android:navigationBarColor","#050606");
  return cfg;
 });
};
