import {useEffect,useState} from "react";
import {Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import {router} from "expo-router";
import Brand from "../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api,API} from "../lib/api";
import {getSession} from "../lib/session";
import {C,radius} from "../theme";

export default function Report(){
 const [d,setD]=useState<any>(null),[shareStatus,setShareStatus]=useState("");
 useEffect(()=>{api("/api/weekly-report").then(setD).catch(()=>router.back())},[]);
 async function share(){try{setShareStatus("GRAFIK WIRD ERSTELLT");const token=await getSession();const r=await fetch(API+"/api/story",{headers:{authorization:"Bearer "+token}});if(!r.ok)throw new Error("Grafik konnte nicht erstellt werden.");const svg=await r.text();const uri=(FileSystem.cacheDirectory||"")+"be-different-story.svg";await FileSystem.writeAsStringAsync(uri,svg);if(await Sharing.isAvailableAsync())await Sharing.shareAsync(uri,{mimeType:"image/svg+xml",dialogTitle:"BE DIFFERENT Story"});setShareStatus("")}catch(e:any){setShareStatus(e.message||"Teilen fehlgeschlagen")}}
 if(!d)return <SafeAreaView style={s.safe}/>;
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}>ZURÜCK</Text></Pressable></View>
  <Eyebrow>WOCHENBERICHT</Eyebrow><Text style={s.title}>DEINE WOCHE.{"\n"}KLAR GESEHEN.</Text>
  <Card style={s.score}><Text style={s.scoreValue}>{d.score}%</Text><Text style={s.delta}>{d.delta>=0?"+":""}{d.delta} PROZENT ZUR VORWOCHE</Text></Card>
  <Card><Eyebrow>TOP 3</Eyebrow><SectionTitle>Was gut lief</SectionTitle>{d.positives.map((x:string,i:number)=><View style={s.row} key={x}><Text style={s.nr}>{String(i+1).padStart(2,"0")}</Text><Text style={s.rowText}>{x}</Text></View>)}</Card>
  {d.full?<><Card><Eyebrow>FOKUS</Eyebrow><SectionTitle>Was gebremst hat</SectionTitle>{d.focus.map((x:string,i:number)=><View style={s.row} key={x}><Text style={s.nr}>{String(i+1).padStart(2,"0")}</Text><Text style={s.rowText}>{x}</Text></View>)}</Card><Card><Eyebrow>NÄCHSTE WOCHE</Eyebrow><SectionTitle>Deine Aufgaben</SectionTitle>{d.actions.map((x:string,i:number)=><View style={s.row} key={x}><Text style={s.nr}>{String(i+1).padStart(2,"0")}</Text><Text style={s.rowText}>{x}</Text></View>)}</Card></>:<Card><Eyebrow>PRO</Eyebrow><SectionTitle>Analyse und nächste Schritte</SectionTitle><Text style={s.copy}>Die kostenlose Version zeigt den Kurzbericht. PRO erklärt Ursachen und konkrete nächste Schritte.</Text><Pressable style={s.primary} onPress={()=>router.push("/membership")}><Text style={s.primaryText}>PRO FREISCHALTEN</Text></Pressable></Card>}
 <Pressable style={s.share} onPress={share}><Text style={s.shareText}>ALS STORY TEILEN →</Text></Pressable>{shareStatus?<Text style={s.shareStatus}>{shareStatus}</Text>:null}</ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:70,gap:12},top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontSize:9,fontWeight:"900"},title:{color:C.ink,fontSize:45,lineHeight:39,fontWeight:"900",letterSpacing:-3,marginVertical:12},score:{alignItems:"center",paddingVertical:28},scoreValue:{color:C.ink,fontSize:78,fontWeight:"900",letterSpacing:-5},delta:{color:C.volt,fontSize:9,fontWeight:"900",letterSpacing:1},row:{flexDirection:"row",gap:12,paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.line},nr:{color:C.volt,fontSize:9,fontWeight:"900"},rowText:{flex:1,color:C.ink,fontSize:12,fontWeight:"800"},copy:{color:C.dim,fontSize:12,lineHeight:19,marginVertical:12},primary:{height:50,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center"},primaryText:{color:C.bg,fontSize:9,fontWeight:"900"},share:{height:50,borderRadius:radius.md,borderWidth:1,borderColor:"#D7FF0066",alignItems:"center",justifyContent:"center"},shareText:{color:C.volt,fontSize:9,fontWeight:"900",letterSpacing:1},shareStatus:{color:C.dim,fontSize:9,textAlign:"center"}});
