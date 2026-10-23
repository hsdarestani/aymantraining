import {useEffect,useState} from "react";
import {Pressable,StyleSheet,Text,View} from "react-native";
import {router} from "expo-router";
import Screen from "../components/Screen";
import {Copy} from "../components/Locale";
import {C} from "../theme";
import {api} from "../lib/api";

const actions=[
 {number:"01",title:"BE FOCUSED",detail:"Zwei Minuten Atmung für deinen Start",route:"/focus"},
 {number:"02",title:"BE RESTED",detail:"Schlaf und Erholung ansehen",route:"/lifestyle"},
 {number:"03",title:"WOCHENCHECK",detail:"Deinen Wochenzustand reflektieren",route:"/checkin"},
 {number:"04",title:"GADGETS",detail:"Aktuelle Gesundheitsdaten synchronisieren",route:"/wearables"}
] as const;
export default function Awake(){
 const [energy,setEnergy]=useState<number|null>(null);
 const [status,setStatus]=useState("");
 const [saving,setSaving]=useState(false);
 useEffect(()=>{api<any>("/api/daily-check").then(x=>setEnergy(x.item?.energy??null)).catch(()=>{})},[]);
 async function saveEnergy(){
  if(energy==null||saving)return;
  setSaving(true);setStatus("");
  try{await api("/api/daily-check",{method:"POST",body:JSON.stringify({energy})});setStatus("TAGESCHECK GESPEICHERT");}
  catch(e:any){setStatus(e.message||"Speichern fehlgeschlagen")}finally{setSaving(false)}
 }
 return <Screen>
  <View style={s.hero}><Text style={s.eyebrow}><Copy text="MORGENROUTINE / 01"/></Text><Text style={s.title}>BE{"\n"}<Text style={s.accent}>AWAKE.</Text></Text><Text style={s.description}><Copy text="Dein Tag beginnt mit Bewusstsein. Wähle deinen nächsten Schritt."/></Text></View>
  <View style={s.checkPanel}>
    <Text style={s.checkTitle}><Copy text="WIE IST DEINE ENERGIE HEUTE?"/></Text>
    <Text style={s.checkHint}><Copy text="Ein Wert für deinen Tagescheck. Du kannst ihn später ändern."/></Text>
    <View style={s.energyRow}>{[1,2,3,4,5,6,7,8,9,10].map(value=><Pressable accessibilityRole="button" accessibilityLabel={String(value)} key={value} onPress={()=>setEnergy(value)} style={[s.energyChoice,energy===value&&s.energyActive]}><Text style={[s.energyText,energy===value&&s.energyTextActive]}>{value}</Text></Pressable>)}</View>
    <Pressable accessibilityRole="button" style={[s.saveButton,energy==null&&{opacity:.4}]} disabled={energy==null||saving} onPress={saveEnergy}><Text style={s.saveLabel}><Copy text={saving?"SPEICHERT…":"TAGESCHECK SPEICHERN"}/></Text></Pressable>
    {status?<Text style={s.checkStatus}><Copy text={status}/></Text>:null}
   </View>
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
 checkPanel:{backgroundColor:"#1A231B",borderColor:"#52652D",borderWidth:1,padding:16,borderRadius:16,gap:12},
 checkTitle:{color:C.ink,fontFamily:"Archivo",fontSize:19},
 checkHint:{color:C.dim,fontFamily:"Manrope",fontSize:11},
 energyRow:{flexDirection:"row",flexWrap:"wrap",gap:4},
 energyChoice:{width:"18%",height:40,borderRadius:8,borderWidth:1,borderColor:"#465146",alignItems:"center",justifyContent:"center"},
 energyActive:{backgroundColor:C.volt,borderColor:C.volt},energyText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:13},energyTextActive:{color:C.bg},
 saveButton:{paddingVertical:13,borderRadius:10,backgroundColor:C.volt,alignItems:"center"},saveLabel:{color:C.bg,fontFamily:"ManropeSemiBold",fontSize:12},
 checkStatus:{color:C.ink,fontFamily:"Manrope",fontSize:11},
 list:{gap:10},action:{minHeight:90,borderRadius:15,padding:16,flexDirection:"row",gap:14,alignItems:"center",borderWidth:1,borderColor:C.line,backgroundColor:"#111714"},number:{color:C.volt,fontFamily:"Archivo",fontSize:24},
 info:{flex:1},name:{color:C.ink,fontFamily:"Archivo",fontSize:17},detail:{color:C.dim,fontFamily:"Manrope",fontSize:11,marginTop:5},arrow:{color:C.volt,fontSize:21},
 note:{color:C.dim,fontFamily:"Manrope",fontSize:11,lineHeight:18}
});
