
import {Copy} from "../components/Locale";
import {useEffect,useState} from "react";
import {ActivityIndicator,Pressable,SafeAreaView,ScrollView,StyleSheet,Text} from "react-native";
import {router} from "expo-router";
import {useStoreBilling} from "../lib/billing";
import {api} from "../lib/api";
import {C,radius} from "../theme";
import Brand from "../components/Brand";

export default function Membership(){
  const [availability,setAvailability]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const billing=useStoreBilling();

  useEffect(()=>{(async()=>{
    try{
      const availabilityData:any=await api("/api/subscription/availability");
      setAvailability(availabilityData);
      await api("/api/subscription/sync",{method:"POST",body:"{}"}).catch(()=>undefined);
    }finally{setLoading(false)}
  })()},[]);

  async function joinWaitlist(){
    billing.setStatus("Warteliste…");
    try{
      await api("/api/subscription/waitlist",{method:"POST"});
      billing.setStatus("Du bist auf der PRO Warteliste.");
    }catch(e:any){billing.setStatus(e.message||"Nicht verfügbar.")}
  }

  async function buy(product:any){
    try{await billing.buy(product)}
    catch{}
  }
  async function restore(){
    try{
      await billing.restore();
      setTimeout(()=>router.replace("/(tabs)"),900);
    }catch{billing.setStatus("Wiederherstellung fehlgeschlagen.")}
  }

  const full=availability&&!availability.available&&availability.waitlist;

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
    <Brand/>
    <Text style={s.kicker}><Copy text={"MITGLIEDSCHAFT"}/></Text>
    <Text style={s.title}><Copy text={"KOSTENLOS ZEIGT DIR DEN EINSTIEG."}/>{"\n"}<Copy text={"PRO MACHT ES"}/>{"\n"}<Copy text={"PERSÖNLICH."}/></Text>
    <Text style={s.copy}><Copy text={"Trainer Radar · direkter Trainer Chat · Sprachnachrichten · Technikvideo · vollständige Berichte · vollständiger Verlauf"}/></Text>

    {loading?<ActivityIndicator color={C.volt}/>:
      full?<Pressable style={s.primary} onPress={joinWaitlist}><Text style={s.primaryText}><Copy text={"PRO WARTELISTE →"}/></Text></Pressable>:
      billing.products.length?billing.products.map((p:any)=><Pressable style={s.primary} key={p.id} onPress={()=>buy(p)}><Text style={s.primaryText}>{p.title||p.id} · {p.displayPrice||""}</Text></Pressable>):
      <Text style={s.unavailable}><Copy text={"Die Produkte im App Store und Play Store sind noch nicht verfügbar. Prüfe die Produktkennungen und die Freigabe."}/></Text>}

    {billing.connected&&<Pressable style={s.restore} onPress={restore}><Text style={s.restoreText}><Copy text={"KÄUFE WIEDERHERSTELLEN"}/></Text></Pressable>}
    <Text style={s.note}><Copy text={billing.connected?"APPLE UND GOOGLE VERBUNDEN":"VERBINDUNG ZU APPLE UND GOOGLE WIRD HERGESTELLT…"}/></Text>
    {availability&&<Text style={s.note}><Copy text={"PRO Plätze:"}/>{availability.active} / {availability.capacity||"∞"}</Text>}
    {billing.status?<Text style={s.status}>{billing.status}</Text>:null}
    <Pressable onPress={()=>router.back()}><Text style={s.back}><Copy text={"← ZURÜCK"}/></Text></Pressable>
  </ScrollView></SafeAreaView>
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},content:{padding:22,paddingBottom:50},
  kicker:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:2,marginTop:44},
  title:{color:C.ink,fontFamily:"Archivo",fontSize:36,lineHeight:40,letterSpacing:-.8,marginTop:12,marginBottom:24},
  copy:{color:C.dim,fontFamily:"Manrope",fontSize:13,lineHeight:21,marginBottom:18},
  primary:{minHeight:54,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",paddingHorizontal:12,marginTop:8},
  primaryText:{color:C.bg,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1,textAlign:"center"},
  restore:{minHeight:48,borderRadius:radius.md,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center",marginTop:9},
  restoreText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1},
  unavailable:{color:C.dim,borderWidth:1,borderColor:C.line,borderRadius:radius.md,padding:14,fontFamily:"Manrope",fontSize:11,lineHeight:18},
  note:{color:C.dim,fontFamily:"Manrope",fontSize:11,lineHeight:14,marginTop:14},
  status:{color:C.green,fontFamily:"Manrope",fontSize:11,marginTop:10},
  back:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1.1,textAlign:"center",marginTop:24}
});
