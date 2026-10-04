import {Platform} from "react-native";
export async function syncHomeWidget(d:any){
 if(Platform.OS!=="ios")return;
 try{
  const mod=await import("@bacons/apple-targets");
  const storage=new mod.ExtensionStorage("group.com.smarbiz.bedifferent");
  storage.set("score",Number(d?.score?.total||0));
  storage.set("level",String(d?.score?.level||"NORMAL"));
  storage.set("workout",String(d?.nextWorkout?.title||"REGENERATION"));
  mod.ExtensionStorage.reloadWidget();
 }catch{}
}
