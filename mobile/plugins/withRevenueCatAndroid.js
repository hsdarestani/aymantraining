const {withAndroidManifest}=require("@expo/config-plugins");

module.exports=function withRevenueCatAndroid(config){
  return withAndroidManifest(config,config=>{
    const manifest=config.modResults.manifest;
    const application=manifest.application?.[0];
    const activities=application?.activity||[];
    const main=activities.find(activity=>
      (activity["intent-filter"]||[]).some(filter=>
        (filter.action||[]).some(action=>action.$?.["android:name"]==="android.intent.action.MAIN")
      )
    );
    if(!main)throw new Error("Main Android activity not found");
    main.$=main.$||{};
    main.$["android:launchMode"]="singleTop";
    return config;
  });
};
