import {useFonts} from "expo-font";
import {LanguagePicker} from "../components/Locale";
import {restoreLocale} from "../lib/i18n/locale";
import {useEffect,useState} from "react";
import {Platform,StyleSheet,View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Stack,useSegments} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {installPushHandlers,setPushNavigationReady} from "../lib/push";
import {C} from "../theme";
import LaunchIntro from "../components/LaunchIntro";
import NativeChrome from "../components/NativeChrome";

export default function Layout(){
  const [ready,setReady]=useState(false);
  const segments=useSegments();
  const insets=useSafeAreaInsets();
  const first=String((segments as readonly string[])[0]||"");
  const isTabs=first==="(tabs)";
  const isAuth=!first||["login","register","forgot-password","reset-password"].includes(first);
  const showInnerHeader=ready&&!isTabs&&!isAuth;
  // Android 15/16 draw edge-to-edge: reserve the real status bar inset for
  // the internal stack. Keep the language action out of page content.
  const topInset=showInnerHeader?Math.max(insets.top,Platform.OS==="android"?24:0):0;
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
  // Keep the navigator mounted under the splash. Replacing the whole React
  // tree as Fabric/Reanimated finishes an animation can produce stale
  // viewState tags on Android (RetryableMountingLayerException).
  return <>
    <StatusBar style="light"/>
    <View style={[s.root,topInset>0&&{paddingTop:topInset}]}>
      {showInnerHeader?<View style={s.innerHeader}><LanguagePicker inline/></View>:null}
      <Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:C.bg},animation:"fade_from_bottom",animationDuration:260}}/>
      {ready?<NativeChrome/>:null}
    </View>
    {!ready?<View pointerEvents="auto" style={[StyleSheet.absoluteFillObject,{zIndex:100}]}>
      <LaunchIntro onDone={()=>setReady(true)}/>
    </View>:null}
  </>;
}

const s=StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},
  innerHeader:{minHeight:52,paddingHorizontal:18,flexDirection:"row",alignItems:"center",justifyContent:"flex-end",borderBottomWidth:1,borderBottomColor:C.line,backgroundColor:C.bg}
});
