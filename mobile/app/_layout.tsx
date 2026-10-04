import {useEffect,useState} from "react";
import {Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {installPushHandlers} from "../lib/push";
import {C} from "../theme";
import LaunchIntro from "../components/LaunchIntro";
import NativeChrome from "../components/NativeChrome";

export default function Layout(){
  const [ready,setReady]=useState(false);
  useEffect(()=>installPushHandlers(),[]);
  if(!ready)return <><StatusBar style="light"/><LaunchIntro onDone={()=>setReady(true)}/></>;
  return <><StatusBar style="light"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:C.bg},animation:"fade_from_bottom",animationDuration:260}}/><NativeChrome/></>;
}
