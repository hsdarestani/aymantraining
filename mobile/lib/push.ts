import {Alert,PermissionsAndroid,Platform} from "react-native";
import {router} from "expo-router";
import {getApp} from "@react-native-firebase/app";
import {
  deleteToken,getMessaging,getToken,getInitialNotification,onMessage,onNotificationOpenedApp,onTokenRefresh,
  registerDeviceForRemoteMessages,requestPermission
} from "@react-native-firebase/messaging";
import {api} from "./api";
import {getSession} from "./session";

let tokenUnsubscribe:(()=>void)|null=null;
let navigationInstalled=false;
let pushNavigationReady=false;
let pendingPushRoute:string|null=null;
let registration:{session:string; result:Promise<PushResult>}|null=null;
let deviceToken:string|null=null;
type PushResult={ok:boolean;reason?:string};

export function setPushNavigationReady(ready:boolean){
  pushNavigationReady=ready;
  if(!ready||!pendingPushRoute)return;
  const route=pendingPushRoute;
  pendingPushRoute=null;
  try{router.push(route as any)}
  catch(error){
    pendingPushRoute=route;
    console.warn("[push] deferred navigation",error);
  }
}

function nativeRoute(route?:string){
  if(!route)return null;
  if(route==="/dashboard")return "/(tabs)";
  if(/^\/training\/[a-zA-Z0-9_-]+$/.test(route))return route.replace("/training/","/workout/");
  if(route==="/training")return "/(tabs)/training";
  if(route==="/progress")return "/(tabs)/progress";
  if(["/report","/journey","/journey-tests","/journey-today","/milestones","/coach-brief"].includes(route))return route;
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
  if(!path)return;
  if(!pushNavigationReady){
    // Cold-start pushes can arrive during the launch animation,
    // before Expo Router has mounted its root navigator.
    pendingPushRoute=path;
    return;
  }
  try{router.push(path as any)}
  catch(error){
    pendingPushRoute=path;
    console.warn("[push] navigation postponed",error);
  }
}

export async function registerPush():Promise<PushResult>{
  if(Platform.OS!=="android"&&Platform.OS!=="ios")return {ok:false,reason:"platform"};
  const session=await getSession();
  if(!session)return {ok:false,reason:"session"};
  if(registration?.session===session)return registration.result;
  const result=registerForSession(session).catch(error=>{
    if(registration?.result===result)registration=null;
    throw error;
  });
  registration={session,result};
  return result;
}

async function registerForSession(session:string):Promise<PushResult>{
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
  if(registration?.session!==session||await getSession()!==session)return {ok:false,reason:"session"};
  deviceToken=token;
  await api("/api/device-token",{method:"POST",body:JSON.stringify({platform:Platform.OS==="ios"?"ios":"android",token})});

  if(!tokenUnsubscribe){
    tokenUnsubscribe=onTokenRefresh(messaging,next=>{
      if(!registration)return;
      deviceToken=next;
      api("/api/device-token",{method:"POST",body:JSON.stringify({platform:Platform.OS==="ios"?"ios":"android",token:next})}).catch(()=>undefined);
    });
  }
  return {ok:true};
}

export function clearPushRegistration(){
  tokenUnsubscribe?.();
  tokenUnsubscribe=null;
  pendingPushRoute=null;
  registration=null;
  const token=deviceToken;
  deviceToken=null;
  if(Platform.OS==="android"||Platform.OS==="ios"){
    try{void deleteToken(getMessaging(getApp())).catch(()=>undefined)}catch{}
  }
  return token;
}

export function installPushHandlers(){
  if(navigationInstalled)return()=>{};
  let messaging:ReturnType<typeof getMessaging>;
  try{
    messaging=getMessaging(getApp());
  }catch(error){
    // Push is optional and must never block launch if Firebase is unavailable.
    console.warn("[push] Firebase not ready; skipping push listeners",error);
    return()=>{};
  }
  let unsubOpen:()=>void=()=>{};
  let unsubForeground:()=>void=()=>{};
  try{
    unsubOpen=onNotificationOpenedApp(messaging,openMessage);
    unsubForeground=onMessage(messaging,message=>{
      const title=message.notification?.title||"BE DIFFERENT";
      const body=message.notification?.body||"";
      void getSession().then(session=>{
        if(session)Alert.alert(title,body,[{text:"OK"},{text:"Öffnen",onPress:()=>openMessage(message)}]);
      }).catch(()=>undefined);
    });
    navigationInstalled=true;
    void getInitialNotification(messaging)
      .then(message=>{if(message)openMessage(message)})
      .catch(error=>console.warn("[push] initial notification unavailable",error));
  }catch(error){
    console.warn("[push] listener initialization failed",error);
    try{unsubOpen()}catch{}
    try{unsubForeground()}catch{}
    navigationInstalled=false;
    return()=>{};
  }
  return()=>{
    try{unsubOpen()}catch{}
    try{unsubForeground()}catch{}
    navigationInstalled=false;
  };
}
