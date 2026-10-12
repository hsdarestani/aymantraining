import {Pressable,StyleSheet,Text,View} from "react-native";
import {router} from "expo-router";
import Screen from "../components/Screen";
import {Copy} from "../components/Locale";
import {C} from "../theme";

const actions=[
 {number:"01",title:"BE FOCUSED",detail:"Zwei Minuten Atmung für deinen Start",route:"/focus"},
 {number:"02",title:"BE RESTED",detail:"Schlaf und Erholung ansehen",route:"/lifestyle"},
 {number:"03",title:"DAILY CHECK",detail:"Deinen heutigen Zustand reflektieren",route:"/onboarding"},
 {number:"04",title:"GADGETS",detail:"Aktuelle Gesundheitsdaten synchronisieren",route:"/wearables"}
] as const;
export default function Awake(){
 return <Screen>
  <View style={s.hero}><Text style={s.eyebrow}>MORGENROUTINE / 01</Text><Text style={s.title}>BE{"\n"}<Text style={s.accent}>AWAKE.</Text></Text><Text style={s.description}><Copy text="Dein Tag beginnt mit Bewusstsein. Wähle deinen nächsten Schritt."/></Text></View>
  <View style={s.list}>{actions.map(a=><Pressable accessibilityRole="button" key={a.number} style={s.action} onPress={()=>router.push(a.route as any)}>
   <Text style={s.number}>{a.number}</Text><View style={s.info}><Text style={s.name}>{a.title}</Text><Text style={s.detail}><Copy text={a.detail}/></Text></View><Text style={s.arrow}>↗</Text>
  </Pressable>)}</View>
  <Text style={s.note}><Copy text="Deine Gerätewerte werden nur nach deiner Freigabe gelesen."/></Text>
 </Screen>;
}
const s=StyleSheet.create({
 hero:{paddingVertical:20,borderBottomWidth:1,borderBottomColor:"#334324"},eyebrow:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:2},
 title:{color:C.ink,fontFamily:"Archivo",fontSize:62,lineHeight:62,marginTop:12},accent:{color:C.volt},
 description:{color:C.dim,fontFamily:"Manrope",fontSize:13,lineHeight:21,maxWidth:280,marginTop:18},
 list:{gap:10},action:{minHeight:90,borderRadius:15,padding:16,flexDirection:"row",gap:14,alignItems:"center",borderWidth:1,borderColor:C.line,backgroundColor:"#111714"},number:{color:C.volt,fontFamily:"Archivo",fontSize:24},
 info:{flex:1},name:{color:C.ink,fontFamily:"Archivo",fontSize:17},detail:{color:C.dim,fontFamily:"Manrope",fontSize:11,marginTop:5},arrow:{color:C.volt,fontSize:21},
 note:{color:C.dim,fontFamily:"Manrope",fontSize:11,lineHeight:18}
});
