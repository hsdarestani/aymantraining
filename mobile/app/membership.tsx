import {Copy} from "../components/Locale";
import {useEffect,useState} from "react";
import {ActivityIndicator,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";
import {router} from "expo-router";
import {api} from "../lib/api";
import {C,radius} from "../theme";
import Brand from "../components/Brand";

export default function Membership(){
 const [tier,setTier]=useState<string|null>(null);
 useEffect(()=>{api<{tier:string}>("/api/entitlements").then(d=>setTier(d.tier||"FREE")).catch(()=>setTier("FREE"))},[]);
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <Brand/>
  <Text style={s.kicker}><Copy text="KONTOSTATUS"/></Text>
  <Text style={s.title}><Copy text="DEIN KONTO."/>{"\n"}<Copy text="DEIN TRAINING."/></Text>
  <Text style={s.copy}><Copy text="Hier siehst du deinen aktuellen Zugang. Deine Trainingsdaten und Fortschritte bleiben in deinem Konto gespeichert."/></Text>
  <View style={s.panel}>
   <Text style={s.label}><Copy text="AKTUELLER ZUGANG"/></Text>
   {tier===null?<ActivityIndicator color={C.volt}/>:<Text style={s.tier}>{tier==="FREE"?"STANDARD":tier}</Text>}
   <Text style={s.note}><Copy text="Dein Kontostatus wird automatisch mit deinem Profil synchronisiert."/></Text>
  </View>
  <Pressable style={s.primary} onPress={()=>router.replace("/(tabs)")}>
   <Text style={s.primaryText}><Copy text="ZUM DASHBOARD →"/></Text>
  </Pressable>
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},content:{padding:22,paddingBottom:60,gap:16},
 kicker:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:2,marginTop:44},
 title:{color:C.ink,fontFamily:"Archivo",fontSize:36,lineHeight:40,letterSpacing:-.8},
 copy:{color:C.dim,fontFamily:"Manrope",fontSize:13,lineHeight:21,marginBottom:8},
 panel:{borderWidth:1,borderColor:C.line,backgroundColor:C.panel,borderRadius:radius.md,padding:20,gap:12},
 label:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1},
 tier:{color:C.volt,fontFamily:"Archivo",fontSize:30},
 note:{color:C.dim,fontFamily:"Manrope",fontSize:11,lineHeight:17},
 primary:{minHeight:54,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",paddingHorizontal:12},
 primaryText:{color:C.bg,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1}
});
