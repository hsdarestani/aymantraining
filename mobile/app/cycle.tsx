import {useCallback,useState} from "react";
import {ActivityIndicator,Alert,Pressable,SafeAreaView,ScrollView,StyleSheet,Switch,Text,TextInput,View} from "react-native";
import {router,useFocusEffect} from "expo-router";
import Brand from "../components/Brand";
import {Copy} from "../components/Locale";
import {api} from "../lib/api";
import {C} from "../theme";
type Entry={date:string;flow:string|null;symptoms:string[];energy:number|null;mood:number|null;discomfort:number|null;planChoice:"AS_PLANNED"|"EASIER"|"REST"};
type State={available:boolean;enabled:boolean;shareWithCoach:boolean;remindersEnabled:boolean;lastPeriodStart:string|null;cycleLengthDays:number|null;forecast:null|{day:number;estimatedNextStarts:string[]};entries:Entry[];reminder:null|{text:string}};
const symptoms=[["CRAMPS","KRÄMPFE"],["HEADACHE","KOPFSCHMERZEN"],["FATIGUE","MÜDIGKEIT"],["BLOATING","BLÄHUNGEN"],["BACK_PAIN","RÜCKENSCHMERZEN"],["OTHER","SONSTIGES"]] as const;
const flows=[["NONE","KEINE"],["LIGHT","LEICHT"],["MEDIUM","MITTEL"],["HEAVY","STARK"]] as const;
const plans=[["AS_PLANNED","WIE GEPLANT"],["EASIER","LEICHTER WÜNSCHEN"],["REST","RUHE WÜNSCHEN"]] as const;
function today(){const x=new Date();return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0")}
function empty():Entry{return {date:today(),flow:null,symptoms:[],energy:null,mood:null,discomfort:null,planChoice:"AS_PLANNED"}}
const dateValid=(date:string)=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date))&&new Date(date+"T00:00:00Z").toISOString().slice(0,10)===date;
export default function Cycle(){
 const [d,setD]=useState<State|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[status,setStatus]=useState("");
 const [consent,setConsent]=useState(false),[shareConfirm,setShareConfirm]=useState(false);
 const [entry,setEntry]=useState<Entry>(empty),[period,setPeriod]=useState(""),[length,setLength]=useState("28");
 const load=useCallback(async()=>{
  try{const x=await api<State>("/api/cycle");setD(x);setPeriod(x.lastPeriodStart||"");setLength(String(x.cycleLengthDays??28));setStatus("")}
  catch(e){setStatus(e instanceof Error?e.message:"Privater Bereich nicht erreichbar")}
  finally{setLoading(false)}
 },[]);
 useFocusEffect(useCallback(()=>{void load()},[load]));
 async function send(path:string,method:string,body:unknown,message:string){
  setBusy(true);setStatus("");
  try{await api(path,{method,body:JSON.stringify(body)});await load();setStatus(message)}
  catch(e){setStatus(e instanceof Error?e.message:"Speichern fehlgeschlagen")}
  finally{setBusy(false)}
 }
 const pref=(body:unknown,label:string)=>send("/api/cycle/preferences","POST",body,label);
 function editDay(day:string){setEntry({...empty(),...(d?.entries.find(x=>x.date===day)||{}),date:day})}
 function revoke(){Alert.alert("Alle Daten entfernen?","Alle privaten Zykluseinträge, die Einwilligung und die Freigabe werden unwiderruflich gelöscht.",[
  {text:"ABBRECHEN",style:"cancel"},{text:"LÖSCHEN",style:"destructive",onPress:()=>{void pref({action:"DISABLE",confirmDeletion:true},"ALLE ZYKLUSDATEN GELÖSCHT")}}])}
 const choice=(on:boolean,onPress:()=>void,label:string)=> <Pressable accessibilityRole="button" accessibilityState={{selected:on,disabled:busy}} disabled={busy} style={[s.option,on&&s.optionOn]} onPress={onPress} key={label}><Text style={s.optionText}>{label}</Text></Pressable>;
 const setting=(label:string,v:number|null,key:"energy"|"mood"|"discomfort")=><View style={s.field}><Text style={s.kicker}>{label}</Text><View style={s.options}>
  {choice(v===null,()=>setEntry({...entry,[key]:null}),"—")}
  {[1,3,5,7,10].map(n=>choice(v===n,()=>setEntry({...entry,[key]:n}),String(n)))}
 </View></View>;
 if(loading)return <View style={s.loading}><ActivityIndicator color={C.volt}/></View>;
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
  <View style={s.header}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.link}><Copy text="ZURÜCK"/></Text></Pressable></View>
  <Text style={s.kicker}><Copy text="FREIWILLIG · PRIVAT"/></Text><Text style={s.heading}>DEIN ZYKLUS.{"\n"}DEINE DATEN.</Text>
  <Text style={s.copy}><Copy text="Deine Aufzeichnungen bleiben privat. Du bestimmst selbst, was du speicherst. Kein Einfluss auf Trainingsstufe oder Leistungswert."/></Text>
  <Text style={s.copy}><Copy text="Schätzungen sind weder für Verhütung noch für Schwangerschaftsberatung geeignet und können stark abweichen."/></Text>
  {!!status&&<Text accessibilityRole="alert" style={s.status}>{status}</Text>}
  {!d?.available?<View style={s.card}><Text style={s.copy}><Copy text="Diese Funktion ist noch nicht freigeschaltet. Dein Training bleibt unverändert."/></Text></View>:
   !d.enabled?<View style={s.card}><Text style={s.title}><Copy text="DEINE FREIWILLIGE ENTSCHEIDUNG"/></Text>
     <Text style={s.copy}><Copy text="Das Tagebuch kann Blutung, Beschwerden, Energie und Stimmung enthalten. Niemand erhält Zugriff ohne deine getrennte Freigabe."/></Text>
     <Text style={s.copy}><Copy text="Du kannst jederzeit alle Daten und die Einwilligung endgültig löschen. Es werden keine intimen Angaben per Push versendet."/></Text>
     <View style={s.row}><Text style={[s.copy,{flex:1}]}><Copy text="ICH STIMME DER VERARBEITUNG MEINER SENSIBLEN ZYKLUSDATEN AUSDRÜCKLICH ZU"/></Text>
      <Switch value={consent} onValueChange={setConsent} trackColor={{true:C.volt}}/></View>
     <Pressable style={[s.primary,(!consent||busy)&&s.disabled]} disabled={!consent||busy} onPress={()=>pref({action:"ENABLE",acknowledgeSensitiveData:true},"TAGEBUCH AKTIVIERT")}><Text style={s.primaryText}>TAGEBUCH AKTIVIEREN</Text></Pressable>
    </View>:<>
     <View style={s.card}><Text style={s.kicker}>PRIVATER KALENDER · NUR SCHÄTZUNG</Text>
      <Text style={s.title}>{d.forecast?"GESCHÄTZTER TAG "+d.forecast.day:"NOCH KEINE SCHÄTZUNG"}</Text>
      <Text style={s.copy}>{d.forecast?"Nächster geschätzter Beginn: "+d.forecast.estimatedNextStarts[0]:"Trage einen bekannten Beginn ein. Ohne aktuelle Angaben zeigen wir keine Prognose."}</Text>
      <Text style={s.copy}>Keine Vorhersage von Eisprung, Fruchtbarkeit oder Schwangerschaft.</Text>
      <Text style={s.kicker}>LETZTER TATSÄCHLICHER BEGINN · JJJJ-MM-TT</Text>
      <TextInput style={s.input} value={period} placeholder="2026-10-22" placeholderTextColor={C.dim} onChangeText={setPeriod} autoCapitalize="none" keyboardType="numbers-and-punctuation" accessibilityLabel="Letzter Periodenbeginn, Jahr Monat Tag"/>
      <Text style={s.kicker}>ÜBLICHE LÄNGE · 20–45 TAGE</Text>
      <TextInput style={s.input} value={length} onChangeText={setLength} keyboardType="number-pad"/>
      <Pressable style={[s.secondary,busy&&s.disabled]} disabled={busy} onPress={()=>{
       if((period&&!dateValid(period))||Number(length)<20||Number(length)>45){setStatus("Bitte ein gültiges Datum und 20 bis 45 Tage eingeben.");return}
       void pref({action:"UPDATE",lastPeriodStart:period||null,cycleLengthDays:Number(length)},"KALENDER GESPEICHERT");
      }}><Text style={s.secondaryText}>KALENDER SPEICHERN</Text></Pressable>
      {d.reminder&&<Text style={s.notice}>{d.reminder.text}</Text>}
     </View>
     <View style={s.card}><Text style={s.kicker}>PRIVATES TAGEBUCH</Text><Text style={s.title}>DEIN BEFINDEN.</Text>
      <Text style={s.kicker}>DATUM · JJJJ-MM-TT</Text>
      <TextInput style={s.input} value={entry.date} onChangeText={v=>setEntry({...entry,date:v})} keyboardType="numbers-and-punctuation" autoCapitalize="none"/>
      <Text style={s.kicker}>BLUTUNG · OPTIONAL</Text>
      <View style={s.options}>{choice(entry.flow===null,()=>setEntry({...entry,flow:null}),"—")}{flows.map(([key,label])=>choice(entry.flow===key,()=>setEntry({...entry,flow:key}),label))}</View>
      <Text style={s.kicker}>BESCHWERDEN · OPTIONAL</Text>
      <View style={s.options}>{symptoms.map(([key,label])=>choice(entry.symptoms.includes(key),()=>setEntry({...entry,symptoms:entry.symptoms.includes(key)?entry.symptoms.filter(v=>v!==key):[...entry.symptoms,key]}),label))}</View>
      {setting("ENERGIE (1–10)",entry.energy,"energy")}{setting("STIMMUNG (1–10)",entry.mood,"mood")}
      {setting("BESCHWERDEN (0–10)",entry.discomfort,"discomfort")}
      <Text style={s.kicker}>DEIN TRAININGSWUNSCH</Text>
      <View style={s.options}>{plans.map(([key,label])=>choice(entry.planChoice===key,()=>setEntry({...entry,planChoice:key}),label))}</View>
      <Text style={s.copy}>Dein Wunsch ändert weder Trainingsplan noch Level automatisch.</Text>
      <Pressable style={[s.primary,busy&&s.disabled]} disabled={busy} onPress={()=>{
       if(!dateValid(entry.date)){setStatus("Datum im Format JJJJ-MM-TT eingeben.");return}
       void send("/api/cycle/entries","PUT",entry,"TAG PRIVAT GESPEICHERT");
      }}><Text style={s.primaryText}>TAG SPEICHERN</Text></Pressable>
      {d.entries.some(x=>x.date===entry.date)&&<Pressable style={s.danger} disabled={busy} onPress={()=>Alert.alert("Tag entfernen?",entry.date,[
       {text:"ABBRECHEN",style:"cancel"},{text:"LÖSCHEN",style:"destructive",onPress:()=>{void send("/api/cycle/entries","DELETE",{date:entry.date},"TAG GELÖSCHT")}}])}><Text style={s.dangerText}>DIESEN TAG LÖSCHEN</Text></Pressable>}
     </View>
     <View style={s.card}><Text style={s.kicker}>DEINE AUFZEICHNUNGEN</Text>
      {d.entries.length===0?<Text style={s.copy}>Noch keine Tage erfasst.</Text>:d.entries.slice(0,35).map(e=><Pressable key={e.date} onPress={()=>editDay(e.date)} style={[s.history,entry.date===e.date&&s.historyOn]}><Text style={s.historyTitle}>{e.date}</Text><Text style={s.copy}>{e.planChoice==="REST"?"Ruhe gewünscht":e.planChoice==="EASIER"?"Leichtere Einheit gewünscht":"Wie geplant"} · Energie {e.energy??"—"}</Text></Pressable>)}
     </View>
     <View style={s.card}><Text style={s.title}><Copy text="DEINE KONTROLLE."/></Text>
      <View style={s.row}><Text style={[s.copy,{flex:1}]}>PRIVATE HINWEISE NUR IM TAGEBUCH</Text><Switch value={d.remindersEnabled} disabled={busy}
       onValueChange={v=>pref({action:"UPDATE",remindersEnabled:v},"HINWEISE GESPEICHERT")} trackColor={{true:C.volt}}/></View>
      <View style={s.row}><Text style={[s.copy,{flex:1}]}>BEGRENZTE TRAININGSSIGNALE MIT ZUGEWIESENEM TRAINER TEILEN</Text>
       <Switch value={d.shareWithCoach} disabled={busy} onValueChange={v=>{if(!v){void pref({action:"SHARE",shareWithCoach:false},"FREIGABE WIDERRUFEN")}else setShareConfirm(true)}} trackColor={{true:C.volt}}/></View>
      {shareConfirm&&!d.shareWithCoach&&<View style={s.share}><Text style={s.copy}>Es werden nur dein Trainingswunsch, Energie und Beschwerden der letzten 14 Tage geteilt, nicht Blutung, Symptome oder Schätzungen.</Text>
       <Pressable style={s.secondary} onPress={()=>{setShareConfirm(false);void pref({action:"SHARE",shareWithCoach:true,confirmShare:true},"FREIGABE ERTEILT")}}><Text style={s.secondaryText}>FREIGABE AUSDRÜCKLICH BESTÄTIGEN</Text></Pressable>
       <Pressable onPress={()=>setShareConfirm(false)}><Text style={s.link}>ABBRECHEN</Text></Pressable></View>}
      <Pressable style={s.danger} onPress={revoke} disabled={busy}><Text style={s.dangerText}>ALLE DATEN LÖSCHEN & EINWILLIGUNG WIDERRUFEN</Text></Pressable>
     </View>
    </>}
  <Pressable onPress={()=>router.back()}><Text style={s.link}><Copy text="ZURÜCK"/></Text></Pressable>
 </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},loading:{flex:1,justifyContent:"center"},body:{padding:18,paddingBottom:90,gap:12},header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",minHeight:55},
 heading:{color:C.ink,fontFamily:"Archivo",fontSize:32,lineHeight:36,marginVertical:10},title:{color:C.ink,fontFamily:"Archivo",fontSize:22,marginVertical:9},kicker:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:.8,marginTop:8},
 copy:{color:C.dim,fontFamily:"Manrope",fontSize:12,lineHeight:20},notice:{color:C.volt,fontSize:12,margin:8},status:{backgroundColor:"#34432C",padding:12,color:C.ink,fontSize:12},card:{backgroundColor:"#17231E",borderWidth:1,borderColor:"#405C48",borderRadius:11,padding:18,gap:9},
 input:{color:C.ink,borderColor:C.line,borderWidth:1,backgroundColor:"#24372D",borderRadius:6,padding:12,minHeight:50},
 options:{flexDirection:"row",flexWrap:"wrap",gap:8,marginVertical:8},option:{borderWidth:1,borderColor:C.line,borderRadius:6,paddingVertical:11,paddingHorizontal:12,minHeight:42,justifyContent:"center"},
 optionOn:{borderColor:C.volt,backgroundColor:"#304A2E"},optionText:{fontSize:11,fontFamily:"ManropeSemiBold",color:C.ink},field:{gap:4,marginVertical:5},
 primary:{padding:16,backgroundColor:C.volt,alignItems:"center",borderRadius:7,marginTop:12},
 primaryText:{color:C.bg,fontFamily:"ManropeSemiBold",fontSize:12},secondary:{padding:14,backgroundColor:"#2D422E",borderRadius:7,alignItems:"center",marginTop:8},
 secondaryText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:11},disabled:{opacity:.5},danger:{padding:14,borderWidth:1,borderColor:"#AD6776",borderRadius:7,marginTop:14},dangerText:{color:"#FFC2CD",fontSize:11,fontFamily:"ManropeSemiBold",textAlign:"center"},
 row:{flexDirection:"row",gap:12,alignItems:"center",justifyContent:"space-between",minHeight:54},history:{padding:12,borderWidth:1,borderColor:C.line,borderRadius:7},historyOn:{borderColor:C.volt},historyTitle:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:12},share:{gap:9,backgroundColor:"#233E2C",padding:12},link:{fontFamily:"ManropeSemiBold",fontSize:11,color:C.volt}
});
