
import {Copy} from "../components/Locale";


import {useEffect,useState} from "react";
import {Pressable,SafeAreaView,ScrollView,StyleSheet,Switch,Text,View} from "react-native";
import {BrandInput as TextInput} from "../components/BrandInput";
import {router} from "expo-router";
import Brand from "../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api} from "../lib/api";
import {C,radius} from "../theme";

function dateText(value?:string|null){if(!value)return"";const d=new Date(value);return Number.isNaN(d.getTime())?"":d.toLocaleDateString("de-DE")}
function parseDate(value:string,hour=12){const m=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());if(!m)return null;const d=new Date(Number(m[3]),Number(m[2])-1,Number(m[1]),hour,0,0);return Number.isNaN(d.getTime())?null:d.toISOString()}

export default function Context(){
 const [v,setV]=useState<any>({nextMatchAt:"",travelDays:0,cycleTrackingEnabled:false,cycleStartDate:"",cycleLengthDays:"28",targetScore:"",targetDate:"",bedtimeTarget:"22:30",stepTarget:"10000",waterTargetMl:"2500",proteinTargetG:"130",preferredMorningHour:"8"});
 const [status,setStatus]=useState("");
 useEffect(()=>{api<any>("/api/athlete-context").then(x=>{const a=x.item||{};const remaining=a.travelModeUntil?Math.max(0,Math.ceil((new Date(a.travelModeUntil).getTime()-Date.now())/86400000)):0;setV((old:any)=>({...old,nextMatchAt:dateText(a.nextMatchAt),travelDays:remaining,cycleTrackingEnabled:Boolean(a.cycleTrackingEnabled),cycleStartDate:dateText(a.cycleStartDate),cycleLengthDays:String(a.cycleLengthDays??28),targetScore:a.targetScore==null?"":String(a.targetScore),targetDate:dateText(a.targetDate),bedtimeTarget:a.bedtimeTarget||"22:30",stepTarget:String(a.stepTarget??10000),waterTargetMl:String(a.waterTargetMl??2500),proteinTargetG:String(a.proteinTargetG??130),preferredMorningHour:String(a.preferredMorningHour??8)}))}).catch(()=>{})},[]);
 async function save(){
  const nextMatchAt=v.nextMatchAt?parseDate(v.nextMatchAt,18):null,targetDate=v.targetDate?parseDate(v.targetDate):null,cycleStartDate=v.cycleStartDate?parseDate(v.cycleStartDate):null;
  if((v.nextMatchAt&&!nextMatchAt)||(v.targetDate&&!targetDate)||(v.cycleStartDate&&!cycleStartDate)){setStatus("Bitte Datum als TT.MM.JJJJ eingeben.");return}
  const travelModeUntil=Number(v.travelDays)>0?new Date(Date.now()+Number(v.travelDays)*86400000).toISOString():null;
  setStatus("SPEICHERE");
  try{await api("/api/athlete-context",{method:"POST",body:JSON.stringify({nextMatchAt,travelModeUntil,cycleTrackingEnabled:v.cycleTrackingEnabled,cycleStartDate,cycleLengthDays:Number(v.cycleLengthDays),targetScore:v.targetScore===""?null:Number(v.targetScore),targetDate,bedtimeTarget:v.bedtimeTarget,stepTarget:Number(v.stepTarget),waterTargetMl:Number(v.waterTargetMl),proteinTargetG:Number(v.proteinTargetG),preferredMorningHour:Number(v.preferredMorningHour)})});setStatus("GESPEICHERT")}catch(e:any){setStatus(e.message||"Fehler")}
 }
 const field=(key:string,label:string,keyboardType:"default"|"number-pad"|"decimal-pad"="default")=><View style={s.field}><Text style={s.label}><Copy text={label}/></Text><TextInput style={s.input} value={String(v[key]??"")} onChangeText={x=>setV({...v,[key]:x})} keyboardType={keyboardType} placeholderTextColor="#666"/></View>;
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}><Copy text={"ZURÜCK"}/></Text></Pressable></View>
  <Eyebrow><Copy text={"DEIN KONTEXT"}/></Eyebrow><Text style={s.title}><Copy text={"TRAINING PASST"}/>{"\n"}<Copy text={"ZU DEINEM LEBEN."}/></Text>
  <Card><Eyebrow><Copy text={"ZIEL"}/></Eyebrow><SectionTitle><Copy text={"Dein nächster Entwicklungspunkt"}/></SectionTitle>{field("targetScore","Zielwert in Prozent","number-pad")}{field("targetDate","Zieldatum · TT.MM.JJJJ")}</Card>
  <Card><Eyebrow><Copy text={"SPIELTAG"}/></Eyebrow><SectionTitle><Copy text={"Belastung rund um dein Spiel"}/></SectionTitle>{field("nextMatchAt","Nächster Spieltag · TT.MM.JJJJ")}<Text style={s.copy}><Copy text={"Vor einem eingetragenen Spiel wird Belastung reduziert. Danach wird Regeneration priorisiert."}/></Text></Card>
  <Card><Eyebrow><Copy text={"REISEMODUS"}/></Eyebrow><SectionTitle><Copy text={"Training ohne Geräte"}/></SectionTitle><View style={s.choices}>{[0,3,7,14].map(n=><Pressable key={n} style={[s.choice,Number(v.travelDays)===n&&s.choiceOn]} onPress={()=>setV({...v,travelDays:n})}><Text style={[s.choiceText,Number(v.travelDays)===n&&s.choiceTextOn]}><Copy text={n===0?"AUS":n+" TAGE"}/></Text></Pressable>)}</View></Card>
  <Card style={s.cycleCard}><Eyebrow>CYCLE TRACKING</Eyebrow><View style={s.switchRow}><View style={{flex:1}}><SectionTitle>Training im Zyklus Kontext</SectionTitle><Text style={s.copy}>Wenn aktiviert, berücksichtigt BE DIFFERENT den freiwillig hinterlegten Zyklus bei Tageshinweisen zu Belastung und Recovery. Die Funktion reagiert zusätzlich auf dein tatsächliches Befinden und ersetzt keine medizinische Beratung.</Text></View><Switch value={v.cycleTrackingEnabled} onValueChange={x=>setV({...v,cycleTrackingEnabled:x})} trackColor={{true:C.volt}}/></View>{v.cycleTrackingEnabled?<>{field("cycleStartDate","Letzter Zyklusbeginn · TT.MM.JJJJ")}{field("cycleLengthDays","Zykluslänge in Tagen","number-pad")}</>:null}</Card>
  <Card><Eyebrow><Copy text={"TAGESZIELE"}/></Eyebrow>{field("stepTarget","Schritte","number-pad")}{field("waterTargetMl","Wasser ml","number-pad")}{field("proteinTargetG","Protein g","decimal-pad")}{field("bedtimeTarget","Ziel Schlafenszeit · HH:MM")}{field("preferredMorningHour","Morgenübersicht ab Stunde","number-pad")}</Card>
  <Pressable style={s.primary} onPress={save}><Text style={s.primaryText}><Copy text={"KONTEXT SPEICHERN"}/></Text></Pressable>{status?<Text style={s.status}><Copy text={status}/></Text>:null}
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:70,gap:12},top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,},title:{color:C.ink,fontFamily:"Archivo",fontSize:36,lineHeight:40,letterSpacing:-.8,marginVertical:12},field:{marginTop:10},label:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1},input:{height:50,borderRadius:radius.md,borderWidth:1,borderColor:C.line,backgroundColor:C.panel2,color:C.ink,paddingHorizontal:13,marginTop:5},copy:{color:C.dim,fontFamily:"Manrope",fontSize:11,lineHeight:16,marginTop:9},choices:{flexDirection:"row",gap:7,flexWrap:"wrap",marginTop:12},choice:{paddingVertical:10,paddingHorizontal:12,borderRadius:12,borderWidth:1,borderColor:C.line},choiceOn:{backgroundColor:C.volt,borderColor:C.volt},choiceText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:11,},choiceTextOn:{color:C.bg},cycleCard:{borderLeftWidth:3,borderLeftColor:C.red,backgroundColor:"#161113"},switchRow:{flexDirection:"row",alignItems:"center",gap:12},primary:{height:54,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center"},primaryText:{color:C.bg,fontFamily:"ManropeSemiBold",fontSize:11,},status:{color:C.green,fontFamily:"Manrope",fontSize:11,textAlign:"center"}});
