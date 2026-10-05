
import {Copy,LocalizedValue} from "../components/Locale";


import {useState} from "react";
import {Pressable,SafeAreaView,StyleSheet,Text,View} from "react-native";
import {router} from "expo-router";
import Brand from "../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api} from "../lib/api";
import {C,radius} from "../theme";

export default function WatchPair(){
 const [code,setCode]=useState(""),[expires,setExpires]=useState(""),[busy,setBusy]=useState(false),[status,setStatus]=useState("");
 async function generate(){setBusy(true);setStatus("");try{const x:any=await api("/api/companion/pair/start",{method:"POST"});setCode(x.code);setExpires(x.expiresAt)}catch(e:any){setStatus(e.message||"Code konnte nicht erstellt werden.")}finally{setBusy(false)}}
 return <SafeAreaView style={s.safe}><View style={s.content}><View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}><Copy text={"ZURÜCK"}/></Text></Pressable></View><Eyebrow><Copy text={"SPORTUHR"}/></Eyebrow><Text style={s.title}>TRAINING{String.fromCharCode(10)}<Copy text={"AM HANDGELENK."}/></Text><Card><SectionTitle><Copy text={"Sportuhr koppeln"}/></SectionTitle><Text style={s.copy}><Copy text={"Öffne BE DIFFERENT auf deiner Apple Watch oder Wear OS Uhr und gib dort den sechsstelligen Code ein. Der Code gilt zehn Minuten und kann nur einmal verwendet werden."}/></Text>{code?<><Text style={s.code}>{code}</Text><Text style={s.exp}><Copy text={"GÜLTIG BIS"}/><LocalizedValue value={new Date(expires)} format="toLocaleTimeString" options={{hour:"2-digit",minute:"2-digit"}}/></Text></>:null}<Pressable style={s.primary} onPress={generate} disabled={busy}><Text style={s.primaryText}><Copy text={busy?"WIRD ERSTELLT":code?"NEUEN CODE ERSTELLEN":"KOPPLUNGSCODE ERSTELLEN"}/></Text></Pressable></Card><Card><Eyebrow><Copy text={"AM HANDGELENK"}/></Eyebrow><Text style={s.copy}><Copy text={"Leistungswert und heutiges Training ansehen, Wiederholungen, Gewicht und RPE erfassen und die Einheit direkt auf der Uhr abschließen. Die Kachel auf dem Startbildschirm zeigt Leistungswert und heutiges Training."}/></Text></Card>{status?<Text style={s.status}><Copy text={status}/></Text>:null}</View></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,gap:12},top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontSize:9,fontWeight:"900"},title:{color:C.ink,fontSize:48,lineHeight:42,fontWeight:"900",letterSpacing:-3,marginVertical:12},copy:{color:C.dim,fontSize:11,lineHeight:18,marginTop:10},code:{color:C.volt,fontSize:54,fontWeight:"900",letterSpacing:8,textAlign:"center",marginTop:20},exp:{color:C.dim,fontSize:8,fontWeight:"900",textAlign:"center",marginTop:5},primary:{height:52,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:18},primaryText:{color:C.bg,fontSize:9,fontWeight:"900"},status:{color:C.red,fontSize:10,textAlign:"center"}});
