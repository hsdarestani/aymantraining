import {useEffect,useState} from "react";
import {ActivityIndicator,Pressable,StyleSheet,Switch,Text,View} from "react-native";
import {useFocusEffect} from "expo-router";
import {useCallback} from "react";
import {api} from "../lib/api";
import {C} from "../theme";
import {Copy} from "./Locale";
type Mode="GENERAL"|"WOMEN";
type Presenter="ANY"|"TRAINERIN";
type Preference={enabled:boolean;mode:Mode;presenterPreference:Presenter};
export default function DashboardPreference(){
 const [value,setValue]=useState<Preference|null>(null),[busy,setBusy]=useState(false);
 const [status,setStatus]=useState(""),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{
  try{const response=await api<{preference:Preference}>("/api/dashboard-preference");setValue(response.preference);setStatus("");}
  catch{setStatus("Ansicht derzeit nicht verfügbar.");}
  finally{setLoading(false)}
 },[]);
 useFocusEffect(useCallback(()=>{void load()},[load]));
 async function save(mode:Mode,presenterPreference:Presenter){
  if(!value||busy)return;const before=value;setBusy(true);setStatus("");
  setValue({...value,mode,presenterPreference});
  try{
   const result=await api<{preference:Preference}>("/api/dashboard-preference",{method:"POST",body:JSON.stringify({mode,presenterPreference})});
   setValue(result.preference);setStatus("ANSICHT GESPEICHERT");
  }catch(e){setValue(before);setStatus(e instanceof Error?e.message:"Speichern fehlgeschlagen");}
  finally{setBusy(false)}
 }
 if(loading)return <ActivityIndicator color={C.volt}/>;
 if(!value?.enabled)return null;
 return <View style={s.card}>
  <Text style={s.kicker}><Copy text="DEINE TRAININGSANSICHT"/></Text>
  <Text style={s.title}>DU ENTSCHEIDEST.</Text>
  <Text style={s.copy}>Freiwillig und jederzeit wechselbar. Alle Sportarten bleiben zugänglich.</Text>
  <View style={s.row}>
   <Pressable accessibilityRole="button" accessibilityState={{selected:value.mode==="GENERAL",disabled:busy}} disabled={busy}
    onPress={()=>save("GENERAL",value.presenterPreference)} style={[s.choice,value.mode==="GENERAL"&&s.selected]}>
    <Text style={s.choiceText}>ALLGEMEIN</Text>
   </Pressable>
   <Pressable accessibilityRole="button" accessibilityState={{selected:value.mode==="WOMEN",disabled:busy}} disabled={busy}
    onPress={()=>save("WOMEN",value.presenterPreference)} style={[s.choice,value.mode==="WOMEN"&&s.selected]}>
    <Text style={s.choiceText}>FRAUENANSICHT</Text>
   </Pressable>
  </View>
  {value.mode==="WOMEN"&&<View style={s.toggle}>
   <Text style={s.copy}>TRAINERINNEN BEVORZUGEN</Text>
   <Switch accessibilityLabel="Aufnahmen mit Trainerinnen bevorzugen" value={value.presenterPreference==="TRAINERIN"}
    disabled={busy} onValueChange={next=>save("WOMEN",next?"TRAINERIN":"ANY")} trackColor={{true:C.volt}}/>
  </View>}
  <Text style={s.copy}>Nur verfügbare freigegebene Aufnahmen. Keine Zyklusdaten erforderlich.</Text>
  {status?<Text accessibilityRole="text" style={s.status}>{status}</Text>:null}
 </View>;
}
const s=StyleSheet.create({
 card:{backgroundColor:"#18251D",padding:18,borderTopWidth:2,borderTopColor:C.volt,gap:11,borderRadius:9},
 kicker:{fontFamily:"ManropeSemiBold",color:C.volt,letterSpacing:1.1,fontSize:10},
 title:{fontFamily:"Archivo",fontSize:24,color:C.ink},copy:{fontFamily:"Manrope",color:C.dim,fontSize:12,lineHeight:19,flexShrink:1},
 row:{flexDirection:"row",gap:8},choice:{flex:1,minHeight:49,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center",borderRadius:7,padding:6},
 selected:{backgroundColor:"#34482C",borderColor:C.volt},choiceText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:11,textAlign:"center"},
 toggle:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10},status:{fontSize:11,color:C.volt}
});
