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
    <Text style={s.kicker}>MEMBERSHIP</Text>
    <Text style={s.title}>FREE SHOWS IT.{"\n"}PRO MAKES IT{"\n"}PERSONAL.</Text>
    <Text style={s.copy}>Coach Radar · direkter Coach Chat · Voice · Technikvideo · volle Reports · vollständige Timeline</Text>

    {loading?<ActivityIndicator color={C.volt}/>:
      full?<Pressable style={s.primary} onPress={joinWaitlist}><Text style={s.primaryText}>PRO WARTELISTE →</Text></Pressable>:
      billing.products.length?billing.products.map((p:any)=><Pressable style={s.primary} key={p.id} onPress={()=>buy(p)}><Text style={s.primaryText}>{p.title||p.id} · {p.displayPrice||""}</Text></Pressable>):
      <Text style={s.unavailable}>Store Produkte sind noch nicht verfügbar. Prüfe Product IDs und Store Freigabe.</Text>}

    {billing.connected&&<Pressable style={s.restore} onPress={restore}><Text style={s.restoreText}>KÄUFE WIEDERHERSTELLEN</Text></Pressable>}
    <Text style={s.note}>{billing.connected?"APPLE / GOOGLE STORE CONNECTED":"Store Verbindung wird hergestellt…"}</Text>
    {availability&&<Text style={s.note}>PRO Plätze: {availability.active} / {availability.capacity||"∞"}</Text>}
    {billing.status?<Text style={s.status}>{billing.status}</Text>:null}
    <Pressable onPress={()=>router.back()}><Text style={s.back}>← BACK</Text></Pressable>
  </ScrollView></SafeAreaView>
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},content:{padding:22,paddingBottom:50},
  kicker:{color:C.volt,fontSize:9,fontWeight:"900",letterSpacing:2,marginTop:44},
  title:{color:C.ink,fontSize:47,lineHeight:41,fontWeight:"900",letterSpacing:-3,marginTop:12,marginBottom:24},
  copy:{color:C.dim,fontSize:13,lineHeight:21,marginBottom:18},
  primary:{minHeight:54,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",paddingHorizontal:12,marginTop:8},
  primaryText:{color:C.bg,fontSize:9,fontWeight:"900",letterSpacing:1,textAlign:"center"},
  restore:{minHeight:48,borderRadius:radius.md,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center",marginTop:9},
  restoreText:{color:C.ink,fontSize:9,fontWeight:"900",letterSpacing:1},
  unavailable:{color:C.dim,borderWidth:1,borderColor:C.line,borderRadius:radius.md,padding:14,fontSize:11,lineHeight:18},
  note:{color:C.dim,fontSize:9,lineHeight:14,marginTop:14},
  status:{color:C.green,fontSize:11,marginTop:10},
  back:{color:C.dim,fontSize:9,fontWeight:"900",letterSpacing:1.1,textAlign:"center",marginTop:24}
});
