
import {Copy} from "../components/Locale";


import {useCallback,useEffect,useState} from "react";
import {Linking,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";
import {router,useFocusEffect} from "expo-router";
import Brand from "../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api} from "../lib/api";
import {syncHealth} from "../lib/health";
import {C,radius} from "../theme";
const names:Record<string,string>={garmin:"Garmin",polar:"Polar",suunto:"Suunto",coros:"COROS",whoop:"WHOOP",oura:"Oura",fitbit:"Fitbit"};
export default function Wearables(){
 const [d,setD]=useState<any>({items:[],providers:[]}),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
 async function load(){const x:any=await api("/api/wearables/connections");setD(x)}
 useFocusEffect(useCallback(()=>{load().catch(e=>setStatus(e.message))},[]));
 async function device(){if(busy)return;setBusy(true);setStatus("SYNCHRONISIERE");try{await syncHealth();setStatus("GESUNDHEITSDATEN AKTUALISIERT")}catch(e:any){setStatus(e.message||"Synchronisierung fehlgeschlagen")}finally{setBusy(false)}}
 async function connect(x:any,action="connect"){if(busy)return;setBusy(true);try{const r:any=await api("/api/wearables/connections",{method:"POST",body:JSON.stringify({provider:x.provider,action})});if(r.connectUrl){await Linking.openURL(r.connectUrl)}else{setStatus(r.pending?"Synchronisierung angefordert.":r.revokePending?"Lokal getrennt. Bitte erneut trennen.":action==="disconnect"?"VERBINDUNG GETRENNT":"DATEN SYNCHRONISIERT");await load()}}catch(e:any){setStatus(e.message||"Verbindung fehlgeschlagen.")}finally{setBusy(false)}}

 const connected=new Map((d.items||[]).map((x:any)=>[x.provider,x]));
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}><View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}><Copy text={"ZURÜCK"}/></Text></Pressable></View><Eyebrow><Copy text={"GESUNDHEITSDATEN"}/></Eyebrow><Text style={s.title}><Copy text={"EINE SICHT"}/>{"\n"}<Copy text={"AUF DEINE DATEN."}/></Text><Card><Eyebrow><Copy text={"TELEFON UND UHR"}/></Eyebrow><SectionTitle><Copy text={"Apple Gesundheitsdaten oder Android Gesundheitsdaten"}/></SectionTitle><Text style={s.copy}><Copy text={"Diese Verbindung liest die freigegebenen Daten direkt auf deinem Gerät."}/></Text><Pressable style={s.primary} disabled={busy} onPress={device}><Text style={s.primaryText}><Copy text={"JETZT SYNCHRONISIEREN"}/></Text></Pressable></Card><Card><Eyebrow><Copy text={"WEITERE ANBIETER"}/></Eyebrow><SectionTitle><Copy text={"Eine Verbindung pro Anbieter"}/></SectionTitle>{(d.providers||[]).map((x:any)=>{const item:any=connected.get(x.provider);return <View style={s.row} key={x.provider}><View style={{flex:1}}><Text style={s.name}>{names[x.provider]||x.provider}</Text><Text style={s.note}><Copy text={item?.status==="CONNECTED"?"VERBUNDEN":x.configured?"BEREIT":"NOCH NICHT AKTIVIERT"}/></Text></View><Pressable style={s.small} disabled={busy||!x.configured} onPress={()=>connect(x,item?.status==="CONNECTED"?"sync":"connect")}><Text style={s.smallText}><Copy text={item?.status==="CONNECTED"?"SYNC":"VERBINDEN"}/></Text></Pressable>{item&&<Pressable style={s.small} disabled={busy} onPress={()=>connect(x,"disconnect")}><Text style={s.smallText}><Copy text={"TRENNEN"}/></Text></Pressable>}</View>})}</Card><Card><Eyebrow><Copy text={"DATENLOGIK"}/></Eyebrow><Text style={s.copy}><Copy text={"Werte verschiedener Hersteller werden gegen deinen persönlichen Verlauf bewertet. Fehlende Daten bleiben als unvollständig sichtbar und werden nicht erfunden."}/></Text></Card>{status?<Text style={s.status}><Copy text={status}/></Text>:null}</ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:70,gap:12},top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontSize:9,fontWeight:"900"},title:{color:C.ink,fontSize:45,lineHeight:40,fontWeight:"900",letterSpacing:-3,marginVertical:12},copy:{color:C.dim,fontSize:11,lineHeight:18,marginTop:10},primary:{height:50,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:14},primaryText:{color:C.bg,fontSize:9,fontWeight:"900"},row:{minHeight:62,flexDirection:"row",alignItems:"center",gap:10,borderBottomWidth:1,borderBottomColor:C.line},name:{color:C.ink,fontSize:12,fontWeight:"900"},note:{color:C.dim,fontSize:8,marginTop:3},small:{minWidth:86,height:38,borderRadius:12,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},smallText:{color:C.volt,fontSize:8,fontWeight:"900"},status:{color:C.green,fontSize:10,textAlign:"center"}});
