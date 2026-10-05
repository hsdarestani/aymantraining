
import {Copy,LocalizedValue} from "../components/Locale";




import {useEffect,useState} from "react";
import {Linking,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";
import {router} from "expo-router";
import Brand from "../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api} from "../lib/api";
import {C,radius} from "../theme";

export default function Events(){
 const [items,setItems]=useState<any[]>([]),[status,setStatus]=useState("");
 async function load(){const x:any=await api("/api/events");setItems(x.items||[])}
 useEffect(()=>{load().catch(()=>{})},[]);
 async function join(id:string){try{const x:any=await api(`/api/events/${id}/join`,{method:"POST"});setStatus("ANGEMELDET");await load();if(x.meetingUrl)await Linking.openURL(x.meetingUrl)}catch(e:any){setStatus(e.message||"Anmeldung fehlgeschlagen")}}
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}><View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}><Copy text={"ZURÜCK"}/></Text></Pressable></View><Eyebrow>BE DIFFERENT EVENTS</Eyebrow><Text style={s.title}><Copy text={"TRAINIEREN."}/>{"\n"}<Copy text={"TESTEN."}/>{"\n"}<Copy text={"TREFFEN."}/></Text>{items.map(x=><Card key={x.id}><View style={s.head}><View style={{flex:1}}><Eyebrow><Copy text={x.type==="VIDEO_CALL"?"VIDEO CALL":x.type==="TEST_DAY"?"TESTTAG":"MEETUP"}/></Eyebrow><SectionTitle>{x.title}</SectionTitle></View><Text style={s.tier}>{x.minTier}</Text></View><Text style={s.date}><LocalizedValue value={new Date(x.startsAt)} format="toLocaleString"/></Text>{x.location?<Text style={s.meta}>{x.location}</Text>:null}{x.description?<Text style={s.copy}>{x.description}</Text>:null}{x.registered&&x.meetingUrl?<Pressable style={s.primary} onPress={()=>Linking.openURL(x.meetingUrl)}><Text style={s.primaryText}><Copy text={"VIDEO CALL ÖFFNEN"}/></Text></Pressable>:<Pressable style={s.secondary} onPress={()=>join(x.id)}><Text style={s.secondaryText}><Copy text={x.registered?"ANGEMELDET":"ANMELDEN"}/></Text></Pressable>}</Card>)}{!items.length?<Card><SectionTitle><Copy text={"Keine Termine geplant."}/></SectionTitle></Card>:null}{status?<Text style={s.status}><Copy text={status}/></Text>:null}</ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:70,gap:12},top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,},title:{color:C.ink,fontFamily:"Archivo",fontSize:36,lineHeight:40,letterSpacing:-.8,marginVertical:12},head:{flexDirection:"row",gap:10,justifyContent:"space-between"},tier:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:11,borderWidth:1,borderColor:"#D7FF0055",borderRadius:20,paddingVertical:6,paddingHorizontal:9},date:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:12,marginTop:12},meta:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:11,marginTop:4},copy:{color:C.dim,fontFamily:"Manrope",fontSize:11,lineHeight:18,marginTop:10},primary:{height:48,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:14},primaryText:{color:C.bg,fontFamily:"ManropeSemiBold",fontSize:11,},secondary:{height:48,borderRadius:radius.md,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center",marginTop:14},secondaryText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:11,},status:{color:C.green,fontFamily:"Manrope",fontSize:11,textAlign:"center"}});
