
import {Copy} from "../components/Locale";
import {useEffect,useState} from "react";
import {Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";
import {router} from "expo-router";
import Brand from "../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api} from "../lib/api";
import {C,radius} from "../theme";

function Value({label,value,unit=""}:{label:string;value:any;unit?:string}){
 return <View style={s.value}><Text style={s.valueLabel}><Copy text={label}/></Text><Text style={s.valueNumber}>{value??"Keine Angabe"}{value!=null&&unit?" "+unit:""}</Text></View>
}

export default function Lifestyle(){
 const [d,setD]=useState<any>(null);
 useEffect(()=>{api<any>("/api/lifestyle").then(setD).catch(()=>{})},[]);
 if(!d)return <SafeAreaView style={s.safe}/>;
 const sl=d.sleep||{},r=d.recovery||{};
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}><Copy text={"ZURÜCK"}/></Text></Pressable></View>
  <Eyebrow>BE RESTED</Eyebrow><Text style={s.title}><Copy text={"ERHOLUNG"}/>{"\n"}<Copy text={"IST TRAINING."}/></Text>
  <View style={s.grid}>
   <Card style={s.half}><Eyebrow><Copy text={"SCHLAFWERT"}/></Eyebrow><Text style={s.big}>{sl.score??"Keine Angabe"}</Text><Text style={s.unit}><Copy text={"VON 100"}/></Text></Card>
   <Card style={s.half}><Eyebrow><Copy text={"LETZTE NACHT"}/></Eyebrow><Text style={s.big}><Copy text={sl.hoursLatest==null?"Keine Angabe":Math.round(sl.hoursLatest*10)/10}/></Text><Text style={s.unit}><Copy text={"STUNDEN"}/></Text></Card>
  </View>
  <Card><Eyebrow><Copy text={"SCHLAF TREND"}/></Eyebrow><SectionTitle><Copy text={"7 und 30 Tage"}/></SectionTitle><View style={s.values}><Value label="7 TAGE" value={sl.average7==null?null:Math.round(sl.average7*10)/10} unit="h"/><Value label="30 TAGE" value={sl.average30==null?null:Math.round(sl.average30*10)/10} unit="h"/><Value label="REGELMÄSSIGKEIT" value={sl.regularity} unit="%"/><Value label="ÄNDERUNG" value={sl.change7==null?null:(sl.change7>=0?"+":"")+sl.change7} unit="h"/></View><Text style={s.bedtime}><Copy text={"ZIEL SCHLAFENSZEIT ·"}/>{sl.bedtimeTarget}</Text></Card>
  {d.advanced?<Card><Eyebrow><Copy text={"REGENERATION"}/></Eyebrow><SectionTitle><Copy text={"Persönliche Signale"}/></SectionTitle><View style={s.values}><Value label="HRV AKTUELL" value={r.hrvLatest==null?null:Math.round(r.hrvLatest)}/><Value label="HRV 7 TAGE" value={r.hrvAverage7==null?null:Math.round(r.hrvAverage7)}/><Value label="RUHEPULS" value={r.restingHrLatest==null?null:Math.round(r.restingHrLatest)} unit="bpm"/><Value label="RUHEPULS 7 TAGE" value={r.restingHrAverage7==null?null:Math.round(r.restingHrAverage7)} unit="bpm"/></View>{sl.stages?<Text style={s.stage}><Copy text={"SCHLAFPHASEN VOM VERBUNDENEN ANBIETER SIND VORHANDEN"}/></Text>:null}</Card>:<Card><Eyebrow>PRO</Eyebrow><SectionTitle><Copy text={"HRV, Ruhepuls, Qualität und Tipps"}/></SectionTitle><Text style={s.copy}><Copy text={"KOSTENLOS zeigt deine Schlafdauer. PRO erklärt Qualität und persönliche Trends."}/></Text><Pressable style={s.primary} onPress={()=>router.push("/membership")}><Text style={s.primaryText}><Copy text={"PRO FREISCHALTEN"}/></Text></Pressable></Card>}
  <Card><Eyebrow><Copy text={"HEUTE BESSER REGENERIEREN"}/></Eyebrow>{(sl.tips||["Daten sammeln und Routine stabil halten."]).map((x:string,i:number)=><View style={s.tip} key={x}><Text style={s.tipNr}>{String(i+1).padStart(2,"0")}</Text><Text style={s.tipText}>{x}</Text></View>)}</Card>
  <Pressable style={s.secondary} onPress={()=>router.push("/focus")}><Text style={s.secondaryText}><Copy text={"ATMUNG UND TAGESCHECK →"}/></Text></Pressable>
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:70,gap:12},top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontSize:9,fontWeight:"900"},title:{color:C.ink,fontSize:48,lineHeight:42,fontWeight:"900",letterSpacing:-3,marginVertical:12},grid:{flexDirection:"row",gap:10},half:{flex:1},big:{color:C.ink,fontSize:42,fontWeight:"900",letterSpacing:-2,marginTop:12},unit:{color:C.dim,fontSize:8,fontWeight:"900"},values:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:14},value:{width:"47%",backgroundColor:C.panel2,borderRadius:12,padding:12},valueLabel:{color:C.dim,fontSize:7,fontWeight:"900",letterSpacing:1},valueNumber:{color:C.ink,fontSize:18,fontWeight:"900",marginTop:4},bedtime:{color:C.volt,fontSize:9,fontWeight:"900",marginTop:14},stage:{color:C.green,fontSize:8,fontWeight:"900",marginTop:12},copy:{color:C.dim,fontSize:11,lineHeight:18,marginTop:10},primary:{height:48,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:12},primaryText:{color:C.bg,fontSize:9,fontWeight:"900"},tip:{flexDirection:"row",gap:10,paddingVertical:10,borderBottomWidth:1,borderBottomColor:C.line},tipNr:{color:C.volt,fontSize:8,fontWeight:"900"},tipText:{color:C.ink,fontSize:11,lineHeight:17,flex:1},secondary:{height:50,borderRadius:radius.md,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},secondaryText:{color:C.ink,fontSize:9,fontWeight:"900"}});
