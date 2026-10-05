
import {Copy,LocalizedTextInput} from "../components/Locale";
import {useEffect,useState} from "react";
import {Pressable,SafeAreaView,Share,StyleSheet,Text,TextInput,View} from "react-native";
import {router} from "expo-router";
import Brand from "../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api} from "../lib/api";
import {C,radius} from "../theme";

export default function Referral(){
 const [code,setCode]=useState(""),[own,setOwn]=useState(""),[successful,setSuccessful]=useState(0),[status,setStatus]=useState("");
 useEffect(()=>{api<any>("/api/referral").then(x=>{setOwn(x.code);setSuccessful(x.successful||0)}).catch(()=>{})},[]);
 async function share(){await Share.share({message:`Trainiere mit BE DIFFERENT. Mein Einladungscode ist ${own}. Nach erfolgreicher Einladung bekomme ich einen Monat PRO geschenkt.`})}
 async function redeem(){try{await api("/api/referral",{method:"POST",body:JSON.stringify({code})});setStatus("EINLADUNG AKZEPTIERT");setCode("")}catch(e:any){setStatus(e.message||"Code konnte nicht eingelöst werden.")}}
 return <SafeAreaView style={s.safe}><View style={s.content}><View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}><Copy text={"ZURÜCK"}/></Text></Pressable></View><Eyebrow><Copy text={"FREUNDE EINLADEN"}/></Eyebrow><Text style={s.title}><Copy text={"GEMEINSAM"}/>{"\n"}<Copy text={"ANDERS."}/></Text><Card><SectionTitle><Copy text={"Dein Einladungscode"}/></SectionTitle><Text style={s.code}>{own||"…"}</Text><Text style={s.copy}><Copy text={"Für jede eingelöste Einladung bekommst du 30 Tage PRO zusätzlich."}/></Text><Pressable style={s.primary} onPress={share}><Text style={s.primaryText}><Copy text={"CODE TEILEN"}/></Text></Pressable><Text style={s.count}>{successful}<Copy text={"ERFOLGREICHE EINLADUNGEN"}/></Text></Card><Card><Eyebrow><Copy text={"CODE ERHALTEN?"}/></Eyebrow><LocalizedTextInput style={s.input} value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="CODE EINGEBEN" placeholderTextColor="#666"/><Pressable style={s.secondary} onPress={redeem}><Text style={s.secondaryText}><Copy text={"EINLÖSEN"}/></Text></Pressable></Card>{status?<Text style={s.status}><Copy text={status}/></Text>:null}</View></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,gap:12},top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontSize:9,fontWeight:"900"},title:{color:C.ink,fontSize:48,lineHeight:42,fontWeight:"900",letterSpacing:-3,marginVertical:12},code:{color:C.volt,fontSize:38,fontWeight:"900",letterSpacing:4,marginVertical:16},copy:{color:C.dim,fontSize:11,lineHeight:18},primary:{height:50,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:14},primaryText:{color:C.bg,fontSize:9,fontWeight:"900"},count:{color:C.dim,fontSize:8,fontWeight:"900",marginTop:12},input:{height:50,borderRadius:radius.md,borderWidth:1,borderColor:C.line,backgroundColor:C.panel2,color:C.ink,paddingHorizontal:13,marginTop:12},secondary:{height:48,borderRadius:radius.md,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center",marginTop:8},secondaryText:{color:C.ink,fontSize:9,fontWeight:"900"},status:{color:C.green,fontSize:10,textAlign:"center"}});
