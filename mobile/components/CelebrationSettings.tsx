import {useCallback,useState} from "react";
import {StyleSheet,Switch,Text,View} from "react-native";
import {useFocusEffect} from "expo-router";
import {api} from "../lib/api";
import {C} from "../theme";
type Pref={enabled:boolean;reduceMotion:boolean};
export default function CelebrationSettings(){
 const [value,setValue]=useState<Pref>({enabled:true,reduceMotion:false}),[available,setAvailable]=useState(false),
  [busy,setBusy]=useState(false),[status,setStatus]=useState("");
 useFocusEffect(useCallback(()=>{
  let current=true;
  api<{enabled:boolean;preference:Pref}>("/api/celebrations").then(d=>{
   if(current&&d.enabled){setValue(d.preference);setAvailable(true)}
  }).catch(()=>{});
  return()=>{current=false};
 },[]));
 async function save(next:Pref){
  if(busy)return;
  const previous=value;setValue(next);setBusy(true);setStatus("");
  try{
   await api("/api/celebrations",{method:"POST",body:JSON.stringify({action:"SET_PREFERENCES",...next})});
   setStatus("EINSTELLUNG GESPEICHERT");
  }catch{setValue(previous);setStatus("SPEICHERN FEHLGESCHLAGEN")}
  finally{setBusy(false)}
 }
 if(!available)return null;
 return <View style={s.panel}>
  <Text style={s.heading}>DEINE ERFOLGSMOMENTE.</Text>
  <Text style={s.copy}>Feiere echten Fortschritt auf deine Weise. Bestätigte Erfolge bleiben immer erhalten.</Text>
  <View style={s.row}><Text style={s.label}>ERFOLGSANZEIGEN AUTOMATISCH ÖFFNEN</Text>
   <Switch accessibilityLabel="Erfolgsanzeigen automatisch öffnen" disabled={busy} value={value.enabled} onValueChange={v=>void save({...value,enabled:v})} trackColor={{true:C.volt}}/></View>
  <View style={s.row}><Text style={s.label}>ERFOLGE OHNE BEWEGTE EFFEKTE ANZEIGEN</Text>
   <Switch accessibilityLabel="Erfolge ohne bewegte Effekte anzeigen" disabled={busy} value={value.reduceMotion} onValueChange={v=>void save({...value,reduceMotion:v})} trackColor={{true:C.volt}}/></View>
  <Text style={s.copy}>Reduzierte Bewegung in deinem Gerät hat immer Vorrang.</Text>
  {!!status&&<Text style={s.status} accessibilityRole="text">{status}</Text>}
 </View>;
}
const s=StyleSheet.create({
 panel:{backgroundColor:"#1B2820",borderWidth:1,borderTopWidth:2,borderColor:"#456F51",borderTopColor:C.volt,
  padding:17,borderRadius:10,gap:10},
 heading:{fontSize:22,color:C.ink,fontFamily:"Archivo"},
 copy:{fontSize:12,color:C.dim,lineHeight:18,fontFamily:"Manrope"},
 row:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12,minHeight:55,
  borderBottomColor:"#34503D",borderBottomWidth:1},
 label:{flex:1,fontSize:11,color:C.ink,fontFamily:"ManropeSemiBold"},
 status:{color:C.volt,fontSize:11}
});
