import {useEffect} from "react";
import {Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {installPushHandlers} from "../lib/push";
import {C} from "../theme";

export default function Layout(){
  useEffect(()=>installPushHandlers(),[]);
  return <><StatusBar style="light"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:C.bg},animation:"fade"}}/></>;
}
