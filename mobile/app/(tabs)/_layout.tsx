import {Redirect, Tabs, useFocusEffect} from "expo-router";
import {useCallback, useState} from "react";
import {Platform, View, useWindowDimensions} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Activity, Crosshair, Flag, Radio, UserRound} from "lucide-react-native";
import type {LucideIcon} from "lucide-react-native";
import {F} from "../../components/FieldKit";
import {getSession} from "../../lib/session";
import {useLocale} from "../../lib/i18n/locale";

function icon(Icon: LucideIcon) {
  return ({color, focused}: {color: string; focused: boolean}) => (
    <View style={{alignItems: "center", justifyContent: "center", minHeight: 28}}>
      {focused && <View style={{position: "absolute", top: -6, width: 17, height: 2, backgroundColor: F.signal}}/>}
      <Icon color={color} size={20} strokeWidth={focused ? 2.2 : 1.75}/>
    </View>
  );
}

export default function TabsLayout() {
  const locale = useLocale();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const compact = width < 380;
  const bottom = Platform.OS === "android" ? Math.max(insets.bottom, 32) : Math.max(insets.bottom,12);
  useFocusEffect(useCallback(() => {
    let active = true;
    getSession().then(token => { if (active) setAuthorized(Boolean(token)); })
      .catch(() => { if (active) setAuthorized(false); });
    return () => { active = false; };
  }, []));
  if (authorized === false) return <Redirect href="/"/>;
  if (authorized === null) return null;
  return (
    <Tabs screenOptions={{
      headerShown: false, tabBarHideOnKeyboard: true, tabBarLabelPosition: "below-icon",
      tabBarActiveTintColor: F.signal, tabBarInactiveTintColor: F.muted,
      tabBarStyle: {height: 60 + bottom, backgroundColor: F.bg, borderTopColor: F.line, paddingTop: 7, paddingBottom: bottom + 5},
      tabBarLabelStyle: {fontFamily: "ManropeSemiBold", fontSize: compact ? 8 : 9, letterSpacing: compact ? 0 : .1},
      tabBarItemStyle: {paddingHorizontal: 0},
      tabBarAllowFontScaling: false,
    }}>
      <Tabs.Screen name="index" options={{title: locale === "en" ? "HOME" : "START", tabBarIcon: icon(Crosshair)}}/>
      <Tabs.Screen name="training" options={{title: "TRAINING", tabBarIcon: icon(Flag)}}/>
      <Tabs.Screen name="progress" options={{title: locale === "en" ? "PROGRESS" : "FORTSCHRITT", tabBarIcon: icon(Activity)}}/>
      <Tabs.Screen name="athlete" options={{title: locale === "en" ? "ATHLETE" : "ATHLET", tabBarIcon: icon(UserRound)}}/>
      <Tabs.Screen name="coach" options={{title: "COACH", tabBarIcon: icon(Radio)}}/>
    </Tabs>
  );
}
