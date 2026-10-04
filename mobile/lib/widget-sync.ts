import {NativeModules,Platform} from "react-native";
export async function syncHomeWidget(d:any){
 const score=Number(d?.score?.total||0),level=String(d?.score?.level||"NORMAL"),workout=String(d?.nextWorkout?.title||"REGENERATION");
 if(Platform.OS==="ios"){
  try{
   const mod=await import("@bacons/apple-targets");
   const storage=new mod.ExtensionStorage("group.com.smarbiz.bedifferent");
   storage.set("score",score);storage.set("level",level);storage.set("workout",workout);mod.ExtensionStorage.reloadWidget();
  }catch{}
 }else if(Platform.OS==="android"){
  try{NativeModules.WidgetSync?.set(score,level,workout)}catch{}
 }
}
