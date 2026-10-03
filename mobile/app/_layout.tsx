import {Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";
import * as Notifications from "expo-notifications";
import {C} from "../theme";

Notifications.setNotificationHandler({
  handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:false,shouldSetBadge:false})
});

export default function Layout(){return <><StatusBar style="light"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:C.bg},animation:"fade"}}/></>}
