import {useEffect,useState} from "react";
import {Linking,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";
import {router} from "expo-router";
import Brand from "../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api} from "../lib/api";
import {syncHealth} from "../lib/health";
import {C,radius} from "../theme";
const names:Record<string,string>={garmin:"Garmin",polar:"Polar",suunto:"Suunto",coros:"COROS",whoop:"WHOOP",oura:"Oura",fitbit:"Fitbit"};
export default function Wearables(){
 const [d,setD]=useState<any>({items:[],providers:[]}),[status,setStatus]=useState("");
 async function load(){const x:any=await api("/api/wearables/connections");setD(x)}
 useEffect(()=>{load().catch(()=>{})},[]);
 async function device(){setStatus("SYNCHRONISIERE");try{await syncHealth();setStatus("GESUNDHEITSDATEN AKTUALISIERT")}catch(e:any){setStatus(e.message||"Synchronisierung fehlgeschlagen")}}
 async function connect(x:any){if(!x.connectUrl){setStatus("Der externe Anbieter ist serverseitig noch nicht aktiviert.");return}await Linking.openURL(x.connectUrl)}
 const connected=new Map((d.items||[]).map((x:any)=>[x.provider,x]));
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}><View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}>ZURÜCK</Text></Pressable></View><Eyebrow>GESUNDHEITSDATEN</Eyebrow><Text style={s.title}>EINE SICHT{"\n"}AUF DEINE DATEN.</Text><Card><Eyebrow>TELEFON UND UHR</Eyebrow><SectionTitle>Apple Health oder Health Connect</SectionTitle><Text style={s.copy}>Diese Verbindung liest die freigegebenen Daten direkt auf deinem Gerät.</Text><Pressable style={s.primary} onPress={device}><Text style={s.primaryText}>JETZT SYNCHRONISIEREN</Text></Pressable></Card><Card><Eyebrow>WEITERE ANBIETER</Eyebrow><SectionTitle>Eine Verbindung pro Anbieter</SectionTitle>{(d.providers||[]).map((x:any)=>{const item:any=connected.get(x.provider);return <View style={s.row} key={x.provider}><View style={{flex:1}}><Text style={s.name}>{names[x.provider]||x.provider}</Text><Text style={s.note}>{item?.status==="CONNECTED"?"VERBUNDEN":x.configured?"BEREIT":"NOCH NICHT AKTIVIERT"}</Text></View><Pressable style={s.small} disabled={item?.status==="CONNECTED"} onPress={()=>connect(x)}><Text style={s.smallText}>{item?.status==="CONNECTED"?"✓":"VERBINDEN"}</Text></Pressable></View>})}</Card><Card><Eyebrow>DATENLOGIK</Eyebrow><Text style={s.copy}>Werte verschiedener Hersteller werden gegen deinen persönlichen Verlauf bewertet. Fehlende Daten bleiben als unvollständig sichtbar und werden nicht erfunden.</Text></Card>{status?<Text style={s.status}>{status}</Text>:null}</ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:70,gap:12},top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontSize:9,fontWeight:"900"},title:{color:C.ink,fontSize:45,lineHeight:40,fontWeight:"900",letterSpacing:-3,marginVertical:12},copy:{color:C.dim,fontSize:11,lineHeight:18,marginTop:10},primary:{height:50,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:14},primaryText:{color:C.bg,fontSize:9,fontWeight:"900"},row:{minHeight:62,flexDirection:"row",alignItems:"center",gap:10,borderBottomWidth:1,borderBottomColor:C.line},name:{color:C.ink,fontSize:12,fontWeight:"900"},note:{color:C.dim,fontSize:8,marginTop:3},small:{minWidth:86,height:38,borderRadius:12,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},smallText:{color:C.volt,fontSize:8,fontWeight:"900"},status:{color:C.green,fontSize:10,textAlign:"center"}});
