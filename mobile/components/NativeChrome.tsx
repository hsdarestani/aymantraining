import {translate} from "../lib/i18n/locale";

import {Copy} from "./Locale";
import {useState} from "react";
import {Modal,Pressable,SafeAreaView,StyleSheet,Text,View} from "react-native";
import {router,useSegments} from "expo-router";
import {ArrowLeft,Menu,X,House,Dumbbell,TrendingUp,MessageCircle,UserRound,BookOpen,Utensils,HeartPulse,Settings,Users} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated,{FadeInDown,FadeInUp} from "react-native-reanimated";
import {C,radius} from "../theme";

const links=[
  {label:"Different AI",path:"/different-ai",icon:MessageCircle},
  {label:"Wearables",path:"/wearables",icon:HeartPulse},
  {label:"START",path:"/(tabs)",icon:House},
  {label:"TRAINING",path:"/(tabs)/training",icon:Dumbbell},
  {label:"FORTSCHRITT",path:"/(tabs)/progress",icon:TrendingUp},
  {label:"TRAINER",path:"/(tabs)/coach",icon:MessageCircle},
  {label:"ATHLET",path:"/(tabs)/athlete",icon:UserRound},
  {label:"ÜBUNGEN",path:"/library",icon:BookOpen},
  {label:"ERNÄHRUNG",path:"/fuel",icon:Utensils},
  {label:"REGENERATION",path:"/lifestyle",icon:HeartPulse},
  {label:"GEMEINSCHAFT",path:"/community",icon:Users},
  {label:"EINSTELLUNGEN",path:"/settings",icon:Settings}
] as const;

export default function NativeChrome(){
  const segments=useSegments();
  const [open,setOpen]=useState(false);
  const first=String((segments as readonly string[])[0]||"");
  const inTabs=first==="(tabs)";
  const root=first==="";
  const onboarding=first==="onboarding";
  const auth=["login","register","forgot-password","reset-password"].includes(first);
  if(inTabs||root||onboarding||auth)return null;

  function go(path:any){setOpen(false);Haptics.selectionAsync().catch(()=>undefined);router.push(path)}
  function back(){Haptics.selectionAsync().catch(()=>undefined);if(router.canGoBack())router.back();else router.replace("/(tabs)")}

  return <>
    <Animated.View entering={FadeInUp.duration(420)} pointerEvents="box-none" style={s.chrome}>
      <Pressable accessibilityLabel={translate("Zurück")} onPress={back} style={s.quick}><ArrowLeft color={C.ink} size={18}/><Text style={s.quickText}><Copy text={"ZURÜCK"}/></Text></Pressable>
      <Pressable accessibilityLabel={translate("Start öffnen")} onPress={()=>go("/(tabs)")} style={s.iconQuick}><House color={C.ink} size={18}/></Pressable>
      <Pressable accessibilityLabel={translate("Training öffnen")} onPress={()=>go("/(tabs)/training")} style={s.iconQuick}><Dumbbell color={C.ink} size={18}/></Pressable>
      <Pressable accessibilityLabel={translate("Menü öffnen")} onPress={()=>setOpen(true)} style={s.menuPill}><Menu color={C.bg} size={18}/><Text style={s.menuText}><Copy text={"MENÜ"}/></Text></Pressable>
    </Animated.View>

    <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>
      <View style={s.modal}>
        <Pressable style={StyleSheet.absoluteFill} onPress={()=>setOpen(false)}/>
        <Animated.View entering={FadeInDown.duration(340)} style={s.sheetWrap}>
          <SafeAreaView style={s.sheet}>
            <View style={s.head}><View><Text style={s.brand}>BE <Text style={s.volt}>DIFFERENT</Text></Text><Text style={s.caption}><Copy text={"DEIN BEREICH"}/></Text></View><Pressable onPress={()=>setOpen(false)} style={s.close}><X color={C.ink} size={20}/></Pressable></View>
            <View style={s.grid}>{links.map(item=>{const Icon=item.icon;return <Pressable key={item.path} onPress={()=>go(item.path)} style={({pressed})=>[s.item,pressed&&s.pressed]}><Icon color={C.volt} size={20}/><Text style={s.itemText}><Copy text={item.label}/></Text></Pressable>})}</View>
            <Text style={s.note}><Copy text={"Alles an einem Ort. Jeder Schritt zählt."}/></Text>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  </>;
}
const s=StyleSheet.create({
 chrome:{position:"absolute",zIndex:90,left:12,right:12,bottom:14,height:58,borderRadius:29,backgroundColor:"#101313F3",borderWidth:1,borderColor:C.line,flexDirection:"row",alignItems:"center",padding:6,gap:6,shadowColor:"#000",shadowOpacity:.38,shadowRadius:16,shadowOffset:{width:0,height:9}},
 quick:{height:46,borderRadius:23,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6,paddingHorizontal:13,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line},quickText:{color:C.ink,fontSize:8,fontWeight:"900",letterSpacing:1},
 iconQuick:{width:46,height:46,borderRadius:23,alignItems:"center",justifyContent:"center",backgroundColor:C.panel2,borderWidth:1,borderColor:C.line},
 menuPill:{flex:1,height:46,borderRadius:23,backgroundColor:C.volt,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:7,paddingHorizontal:15},menuText:{color:C.bg,fontSize:8,fontWeight:"900",letterSpacing:1.2},
 modal:{flex:1,backgroundColor:"rgba(0,0,0,.62)",justifyContent:"flex-end"},sheetWrap:{width:"100%"},
 sheet:{backgroundColor:"#090B0A",borderTopLeftRadius:30,borderTopRightRadius:30,borderWidth:1,borderColor:C.line,padding:18,paddingBottom:28},
 head:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:18},brand:{color:C.ink,fontSize:20,fontWeight:"900",letterSpacing:-1},volt:{color:C.volt},caption:{color:C.dim,fontSize:8,fontWeight:"900",letterSpacing:1.5,marginTop:3},
 close:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},grid:{flexDirection:"row",flexWrap:"wrap",gap:8},
 item:{width:"48.5%",minHeight:72,borderRadius:radius.md,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,justifyContent:"center",padding:13,gap:8},itemText:{color:C.ink,fontSize:9,fontWeight:"900",letterSpacing:.8},pressed:{transform:[{scale:.98}],borderColor:"rgba(215,255,0,.45)"},
 note:{color:C.dim,fontSize:10,lineHeight:16,textAlign:"center",marginTop:18}
});
