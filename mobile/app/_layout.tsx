import {useFonts} from "expo-font";
import {LanguagePicker} from "../components/Locale";
import {restoreLocale} from "../lib/i18n/locale";
import {useEffect,useState} from "react";
import {Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {installPushHandlers,setPushNavigationReady} from "../lib/push";
import {C} from "../theme";
import LaunchIntro from "../components/LaunchIntro";
import NativeChrome from "../components/NativeChrome";

export default function Layout(){
  const [ready,setReady]=useState(false);
  const [fontsLoaded,fontError]=useFonts({Manrope:require("../assets/fonts/Manrope_500Medium.ttf"),ManropeSemiBold:require("../assets/fonts/Manrope_600SemiBold.ttf"),Archivo:require("../assets/fonts/Archivo_800ExtraBold.ttf")});
  useEffect(()=>installPushHandlers(),[]);
  useEffect(()=>{void restoreLocale().catch(error=>console.warn("[locale] restore failed",error))},[]);
  useEffect(()=>{
    if(!ready)return;
    // Do not route cold-start notification taps while the intro is replacing
    // itself with the navigation stack; the navigator needs a mounted frame.
    const timer=setTimeout(()=>setPushNavigationReady(true),250);
    return()=>{clearTimeout(timer);setPushNavigationReady(false)};
  },[ready]);
  if(!fontsLoaded&&!fontError)return <StatusBar style="light"/>;
  if(!ready)return <><StatusBar style="light"/><LaunchIntro onDone={()=>setReady(true)}/></>;
  return <><StatusBar style="light"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:C.bg},animation:"fade_from_bottom",animationDuration:260}}/><NativeChrome/><LanguagePicker/></>;
}
