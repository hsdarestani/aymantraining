import {useFonts} from "expo-font";
import {LanguagePicker} from "../components/Locale";
import {restoreLocale} from "../lib/i18n/locale";
import {useEffect,useState} from "react";
import {Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {installPushHandlers} from "../lib/push";
import {C} from "../theme";
import LaunchIntro from "../components/LaunchIntro";
import NativeChrome from "../components/NativeChrome";

export default function Layout(){
  const [ready,setReady]=useState(false);
  const [fontsLoaded,fontError]=useFonts({Manrope:require("../assets/fonts/Manrope_500Medium.ttf"),ManropeSemiBold:require("../assets/fonts/Manrope_600SemiBold.ttf"),Archivo:require("../assets/fonts/Archivo_800ExtraBold.ttf")});
  useEffect(()=>installPushHandlers(),[]);
  useEffect(()=>{void restoreLocale()},[]);
  if(!fontsLoaded&&!fontError)return <StatusBar style="light"/>;
  if(!ready)return <><StatusBar style="light"/><LaunchIntro onDone={()=>setReady(true)}/></>;
  return <><StatusBar style="light"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:C.bg},animation:"fade_from_bottom",animationDuration:260}}/><NativeChrome/><LanguagePicker/></>;
}
