import {useEffect,useState} from "react";
import {ActivityIndicator,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";
import {router} from "expo-router";
import {availablePackages,billingConfigured,configureBilling,purchasePackage,restorePurchases} from "../lib/billing";
import {api} from "../lib/api";
import {C,radius} from "../theme";
import Brand from "../components/Brand";

export default function Membership(){
  const [packages,setPackages]=useState<any[]>([]);\n  const [availability,setAvailability]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [status,setStatus]=useState("");

  useEffect(()=>{(async()=>{
    try{
      const d:any=await api("/api/mobile/dashboard");\n      const availabilityData:any=await api("/api/subscription/availability");setAvailability(availabilityData);
      if(await configureBilling(d.user.id))setPackages(await availablePackages());
    }finally{setLoading(false)}
  })()},[]);

  async function trial(){
    setStatus("Trial wird aktiviert…");
    try{
      await api("/api/subscription/trial",{method:"POST"});
      setStatus("PRO Trial aktiv.");
      setTimeout(()=>router.replace("/(tabs)"),500);
    }catch(e:any){setStatus(e.message||"Trial nicht verfügbar.");}
  }

  async function joinWaitlist(){setStatus("Warteliste…");try{await api("/api/subscription/waitlist",{method:"POST"});setStatus("Du bist auf der PRO Warteliste.")}catch(e:any){setStatus(e.message||"Nicht verfügbar.")}}\n\n  async function buy(p:any){
    setStatus("Kauf wird verarbeitet…");
    try{
      await purchasePackage(p);
      setStatus("PRO aktiviert.");
      setTimeout(()=>router.replace("/(tabs)"),700);
    }catch(e:any){
      if(String(e?.userCancelled||"")==="true")setStatus("Kauf abgebrochen.");
      else setStatus("Kauf nicht abgeschlossen.");
    }
  }

  async function restore(){
    setStatus("Käufe werden wiederhergestellt…");
    try{
      await restorePurchases();
      setStatus("Käufe synchronisiert.");
      setTimeout(()=>router.replace("/(tabs)"),700);
    }catch{setStatus("Wiederherstellung fehlgeschlagen.");}
  }

  const connected=billingConfigured();
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
    <Brand/>
    <Text style={s.kicker}>MEMBERSHIP</Text>
    <Text style={s.title}>FREE SHOWS IT.{"\n"}PRO MAKES IT{"\n"}PERSONAL.</Text>
    <View style={s.card}>
      <Text style={s.plan}>PRO</Text>
      <Text style={s.price}>BUILD YOUR ATHLETE</Text>
      <Text style={s.copy}>Coach Radar · direkter Coach Chat · Voice · Technikvideo · volle Reports · vollständige Timeline</Text>
      {loading?<ActivityIndicator color={C.volt}/>:
        packages.length?packages.map((p:any)=><Pressable style={s.primary} key={p.identifier} onPress={()=>buy(p)}><Text style={s.primaryText}>{p.product?.title||p.identifier} · {p.product?.priceString||""}</Text></Pressable>):
        <Pressable style={s.primary} onPress={trial}><Text style={s.primaryText}>7 TAGE PRO TESTEN →</Text></Pressable>}
      {connected&&<Pressable style={s.restore} onPress={restore}><Text style={s.restoreText}>KÄUFE WIEDERHERSTELLEN</Text></Pressable>}
      <Text style={s.note}>{connected?"STORE BILLING CONNECTED":"Store Keys fehlen noch. Bis dahin ist nur der interne Testmodus aktiv."}</Text>
      {status?<Text style={s.status}>{status}</Text>:null}
    </View>
    <Pressable onPress={()=>router.back()}><Text style={s.back}>← BACK</Text></Pressable>
  </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},content:{padding:22,paddingBottom:50},
  kicker:{color:C.volt,fontSize:9,fontWeight:"900",letterSpacing:2,marginTop:44},
  title:{color:C.ink,fontSize:47,lineHeight:41,fontWeight:"900",letterSpacing:-3,marginTop:12,marginBottom:24},
  card:{padding:22,borderRadius:30,borderWidth:1,borderColor:"#D7FF0040",backgroundColor:"#10150C"},
  plan:{color:C.volt,fontSize:10,fontWeight:"900",letterSpacing:2},
  price:{color:C.ink,fontSize:30,fontWeight:"900",letterSpacing:-1.5,marginTop:12},
  copy:{color:C.dim,fontSize:13,lineHeight:21,marginVertical:18},
  primary:{minHeight:54,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",paddingHorizontal:12,marginTop:8},
  primaryText:{color:C.bg,fontSize:9,fontWeight:"900",letterSpacing:1,textAlign:"center"},
  restore:{minHeight:48,borderRadius:radius.md,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center",marginTop:9},
  restoreText:{color:C.ink,fontSize:9,fontWeight:"900",letterSpacing:1},
  note:{color:C.dim,fontSize:9,lineHeight:14,marginTop:14},status:{color:C.green,fontSize:11,marginTop:10},
  back:{color:C.dim,fontSize:9,fontWeight:"900",letterSpacing:1.1,textAlign:"center",marginTop:24}
});