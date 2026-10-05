
import {Copy,LocalizedValue} from "../components/Locale";


import {useEffect,useMemo,useState} from "react";
import {Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";
import {useAudioPlayer} from "expo-audio";
import {router} from "expo-router";
import Brand from "../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api,API} from "../lib/api";
import {getSession} from "../lib/session";
import {C,radius} from "../theme";

function Player({mediaId,token}:{mediaId:string;token:string}){const src=useMemo(()=>({uri:API+"/api/media/"+mediaId,headers:{Authorization:"Bearer "+token}}),[mediaId,token]);const p=useAudioPlayer(src);return <Pressable style={s.play} onPress={()=>p.play()}><Text style={s.playText}><Copy text={"TRAINERSTIMME ABSPIELEN"}/></Text></Pressable>}
export default function CoachBrief(){
 const [item,setItem]=useState<any>(null),[token,setToken]=useState("");
 useEffect(()=>{Promise.all([api<any>("/api/coach-brief"),getSession()]).then(([x,t])=>{setItem(x.item);setToken(t||"")}).catch(()=>{})},[]);
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}><View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}><Copy text={"ZURÜCK"}/></Text></Pressable></View><Eyebrow><Copy text={"MORGENÜBERSICHT"}/></Eyebrow><Text style={s.title}><Copy text={"DEIN TRAINER."}/>{"\n"}<Copy text={"DEIN MORGEN."}/></Text>{item?<Card><Eyebrow>{item.audienceTier}</Eyebrow><SectionTitle>{item.title}</SectionTitle>{item.body?<Text style={s.copy}>{item.body}</Text>:null}{item.mediaId&&token?<Player mediaId={item.mediaId} token={token}/>:null}<Text style={s.date}><LocalizedValue value={new Date(item.publishAt)} format="toLocaleString"/></Text></Card>:<Card><SectionTitle><Copy text={"Noch keine Morgenübersicht."}/></SectionTitle><Text style={s.copy}><Copy text={"Sobald dein Trainer eine neue Nachricht veröffentlicht, erscheint sie hier."}/></Text></Card>}</ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:70,gap:12},top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontSize:9,fontWeight:"900"},title:{color:C.ink,fontSize:48,lineHeight:42,fontWeight:"900",letterSpacing:-3,marginVertical:12},copy:{color:C.dim,fontSize:12,lineHeight:19,marginTop:12},play:{height:52,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:16},playText:{color:C.bg,fontSize:9,fontWeight:"900"},date:{color:C.dim,fontSize:8,marginTop:12}});
