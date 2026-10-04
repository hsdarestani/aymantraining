import {Alert,PermissionsAndroid,Platform} from "react-native";
import {router} from "expo-router";
import {getApp} from "@react-native-firebase/app";
import {
  getMessaging,getToken,getInitialNotification,onMessage,onNotificationOpenedApp,onTokenRefresh,
  registerDeviceForRemoteMessages,requestPermission
} from "@react-native-firebase/messaging";
import {api} from "./api";

let tokenUnsubscribe:(()=>void)|null=null;
let navigationInstalled=false;

function nativeRoute(route?:string){
  if(!route)return null;
  if(route==="/dashboard")return "/(tabs)";
  if(route.startsWith("/training/"))return route.replace("/training/","/workout/");
  if(route==="/training")return "/(tabs)/training";
  if(route==="/progress"||route==="/report")return "/(tabs)/progress";
  if(route==="/coach")return "/(tabs)/coach";
  if(route==="/athlete")return "/(tabs)/athlete";
  if(route==="/fuel")return "/fuel";
  if(route==="/lifestyle")return "/lifestyle";
  if(route==="/community")return "/community";
  if(route==="/tests")return "/tests";
  return null;
}
function openMessage(message:any){
  const path=nativeRoute(String(message?.data?.route||""));
  if(path)router.push(path as any);
}

export async function registerPush(){
  const messaging=getMessaging(getApp());
  if(Platform.OS==="android"&&Number(Platform.Version)>=33){
    const permission=await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    if(permission!==PermissionsAndroid.RESULTS.GRANTED)return {ok:false,reason:"permission"};
  }
  if(Platform.OS==="ios"){
    const permission=await requestPermission(messaging);
    if(Number(permission)<=0)return {ok:false,reason:"permission"};
  }
  await registerDeviceForRemoteMessages(messaging).catch(()=>undefined);
  const token=await getToken(messaging);
  if(!token)return {ok:false,reason:"token"};
  await api("/api/device-token",{method:"POST",body:JSON.stringify({platform:Platform.OS==="ios"?"ios":"android",token})});

  if(!tokenUnsubscribe){
    tokenUnsubscribe=onTokenRefresh(messaging,next=>{
      api("/api/device-token",{method:"POST",body:JSON.stringify({platform:Platform.OS==="ios"?"ios":"android",token:next})}).catch(()=>undefined);
    });
  }
  return {ok:true};
}

export function installPushHandlers(){
  if(navigationInstalled)return()=>{};
  navigationInstalled=true;
  const messaging=getMessaging(getApp());
  const unsubOpen=onNotificationOpenedApp(messaging,openMessage);
  const unsubForeground=onMessage(messaging,async message=>{
    const title=message.notification?.title||"BE DIFFERENT";
    const body=message.notification?.body||"";
    Alert.alert(title,body,[{text:"OK"},{text:"ÖFFNEN",onPress:()=>openMessage(message)}]);
  });
  getInitialNotification(messaging).then(message=>{if(message)setTimeout(()=>openMessage(message),300)}).catch(()=>undefined);
  return()=>{unsubOpen();unsubForeground();navigationInstalled=false};
}
