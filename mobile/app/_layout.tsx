import {Stack} from "expo-router";import {StatusBar} from "expo-status-bar";import {C} from "../theme";
export default function Layout(){return <><StatusBar style="light"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:C.bg},animation:"fade"}}/></>}
