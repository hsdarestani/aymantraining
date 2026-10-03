import {Platform} from "react-native";
import * as Notifications from "expo-notifications";
import {api} from "./api";

export async function registerPush(){
  const projectId=process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if(!projectId)return {ok:false,reason:"project_id"};
  const current=await Notifications.getPermissionsAsync();
  let status=current.status;
  if(status!=="granted")status=(await Notifications.requestPermissionsAsync()).status;
  if(status!=="granted")return {ok:false,reason:"permission"};
  const token=await Notifications.getExpoPushTokenAsync({projectId});
  await api("/api/device-token",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({platform:Platform.OS==="ios"?"ios":"android",token:token.data})});
  return {ok:true};
}
