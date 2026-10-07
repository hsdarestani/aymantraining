
import {Copy} from "../components/Locale";
import {useEffect,useState} from "react";
import {Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";
import {router} from "expo-router";
import Animated,{FadeInRight} from "react-native-reanimated";
import Brand from "../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api} from "../lib/api";
import {C,radius} from "../theme";

const recoveryLibrary=[
 {title:"WECHSELDUSCHE",duration:"6–10 MIN",why:"Kreislauf aktivieren und nach Belastung bewusst runterfahren.",steps:["2 Min. warm starten","30–45 Sek. kühl","60–90 Sek. warm","3–4 Runden","Kühl beenden wenn es sich gut anfühlt"]},
 {title:"ERHOLUNGSSPAZIERGANG",duration:"20–40 MIN",why:"Leichte Bewegung ohne zusätzliche Trainingsbelastung.",steps:["Tempo so wählen, dass Nasenatmung möglich bleibt","Keine Steigungen oder Intervalle erzwingen","Schultern locker, Schritt ruhig","Danach Wasser und normale Mahlzeit"]},
 {title:"MOBILITY RESET",duration:"8–12 MIN",why:"Bewegung erhalten ohne aggressives Dehnen.",steps:["Hüfte 90/90","Brustwirbelsäule rotieren","Sprunggelenke mobilisieren","Jede Position ruhig 45–60 Sek."]},
 {title:"2 MIN ATMUNG",duration:"2 MIN",why:"Vom Belastungsmodus in einen ruhigeren Zustand wechseln.",steps:["4 Sek. einatmen","4 Sek. ausatmen","Kiefer und Schultern locker","2 Minuten ohne Leistungsdruck"]},
 {title:"SCHLAF ROUTINE",duration:"30–60 MIN",why:"Dem Körper jeden Abend ein klares Ende des Tages geben.",steps:["Licht reduzieren","Letzte intensive Arbeit beenden","Zimmer kühl und dunkel halten","Zielzeit möglichst konstant halten"]}
] as const;

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
  <View style={s.libraryHead}><Eyebrow><Copy text="RECOVERY BIBLIOTHEK"/></Eyebrow><Text style={s.libraryTitle}>WISSEN, WAS ZU TUN IST.</Text></View>
  {recoveryLibrary.map((item,i)=><Animated.View entering={FadeInRight.delay(i*70).duration(360)} key={item.title} style={s.recoveryItem}>
    <View style={s.recoveryTop}><Text style={s.recoveryNr}>{String(i+1).padStart(2,"0")}</Text><View style={s.recoveryFlex}><Text style={s.recoveryTitle}>{item.title}</Text><Text style={s.recoveryDuration}>{item.duration}</Text></View></View>
    <Text style={s.recoveryWhy}>{item.why}</Text>
    {item.steps.map((step,n)=><View key={step} style={s.step}><Text style={s.stepDot}>{n+1}</Text><Text style={s.stepText}>{step}</Text></View>)}
  </Animated.View>)}
  <Pressable style={s.secondary} onPress={()=>router.push("/focus")}><Text style={s.secondaryText}><Copy text={"ATMUNG UND TAGESCHECK →"}/></Text></Pressable>
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:70,gap:12},top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,},title:{color:C.ink,fontFamily:"Archivo",fontSize:36,lineHeight:40,letterSpacing:-.8,marginVertical:12},grid:{flexDirection:"row",gap:10},half:{flex:1},big:{color:C.ink,fontFamily:"Archivo",fontSize:36,letterSpacing:-.8,marginTop:12},unit:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,},values:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:14},value:{width:"47%",backgroundColor:C.panel2,borderRadius:12,padding:12},valueLabel:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1},valueNumber:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:18,marginTop:4},bedtime:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:11,marginTop:14},stage:{color:C.green,fontFamily:"ManropeSemiBold",fontSize:11,marginTop:12},copy:{color:C.dim,fontFamily:"Manrope",fontSize:11,lineHeight:18,marginTop:10},primary:{height:48,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:12},primaryText:{color:C.bg,fontFamily:"ManropeSemiBold",fontSize:11,},tip:{flexDirection:"row",gap:10,paddingVertical:10,borderBottomWidth:1,borderBottomColor:C.line},tipNr:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:11,},tipText:{color:C.ink,fontFamily:"Manrope",fontSize:11,lineHeight:17,flex:1},secondary:{height:50,borderRadius:radius.md,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},secondaryText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:11,},
 libraryHead:{paddingTop:8,paddingBottom:2},libraryTitle:{color:C.ink,fontFamily:"Archivo",fontSize:25,letterSpacing:-.7,marginTop:4},
 recoveryItem:{padding:16,backgroundColor:"#101416",borderLeftWidth:2,borderLeftColor:C.red,marginBottom:2},
 recoveryTop:{flexDirection:"row",alignItems:"center",gap:12},recoveryNr:{color:C.red,fontFamily:"Archivo",fontSize:30},recoveryFlex:{flex:1},recoveryTitle:{color:C.ink,fontFamily:"Archivo",fontSize:18},recoveryDuration:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1,marginTop:2},
 recoveryWhy:{color:C.dim,fontFamily:"Manrope",fontSize:11,lineHeight:17,marginVertical:10},step:{flexDirection:"row",gap:9,alignItems:"flex-start",paddingVertical:5},stepDot:{width:20,height:20,borderRadius:10,backgroundColor:"#2A1115",color:C.red,textAlign:"center",lineHeight:20,fontFamily:"ManropeSemiBold",fontSize:9},stepText:{flex:1,color:C.ink,fontFamily:"Manrope",fontSize:11,lineHeight:17}
});
