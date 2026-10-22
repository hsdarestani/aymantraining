import {useCallback,useState} from "react";
import {Alert,Pressable,SafeAreaView,ScrollView,StyleSheet,Switch,Text,TextInput,View} from "react-native";
import {router,useFocusEffect} from "expo-router";
import {Copy} from "../components/Locale";
import {api} from "../lib/api";
import Brand from "../components/Brand";
import {C} from "../theme";

type Entry={date:string;flow:string|null;symptoms:string[];energy:number|null;mood:number|null;discomfort:number|null;planChoice:string};
type State={available:boolean;enabled:boolean;shareWithCoach:boolean;remindersEnabled:boolean;lastPeriodStart:string|null;cycleLengthDays:number|null;
 forecast:{day:number;estimatedNextStarts:string[]}|null;reminder:{text:string}|null;entries:Entry[]};
const codes=[["CRAMPS","Krämpfe"],["HEADACHE","Kopfschmerzen"],["FATIGUE","Müdigkeit"],["BLOATING","Blähungen"],["BACK_PAIN","Rückenschmerzen"],["OTHER","Sonstige"]] as const;
const flows=[["","Keine Angabe"],["NONE","Keine"],["LIGHT","Leicht"],["MEDIUM","Mittel"],["HEAVY","Stark"]] as const;
const choices=[["AS_PLANNED","Wie geplant"],["EASIER","Leichter"],["REST","Ruhe"]] as const;
const dateKey=(d:Date)=>d.getUTCFullYear()+"-"+String(d.getUTCMonth()+1).padStart(2,"0")+"-"+String(d.getUTCDate()).padStart(2,"0");
const initial=(date:string):Entry=>({date,flow:null,symptoms:[],energy:null,mood:null,discomfort:null,planChoice:"AS_PLANNED"});
export default function PrivateCycle(){
 const [value,setValue]=useState<State|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[status,setStatus]=useState("");
 const [consent,setConsent]=useState(false),[date,setDate]=useState(dateKey(new Date())),[entry,setEntry]=useState<Entry>(initial(dateKey(new Date())));
 const [period,setPeriod]=useState(""),[length,setLength]=useState("28"),[month,setMonth]=useState(dateKey(new Date()).slice(0,7));
 const load=useCallback(async()=>{const data=await api<State>("/api/cycle");setValue(data);setPeriod(data.lastPeriodStart||"");setLength(String(data.cycleLengthDays??28));
  setEntry(data.entries.find(e=>e.date===date)||initial(date));},[date]);
 useFocusEffect(useCallback(()=>{void load().catch(e=>setError(e instanceof Error?e.message:"Nicht verfügbar"))},[load]));
 async function change(url:string,method:"POST"|"PUT"|"DELETE",body:unknown){
  if(busy)return;setBusy(true);setError("");setStatus("");
  try{await api(url,{method,body:JSON.stringify(body)});await load();setStatus("GESPEICHERT");}
  catch(e){setError(e instanceof Error?e.message:"Änderung fehlgeschlagen");}
  finally{setBusy(false)}
 }
 const select=(key:string)=>{setDate(key);setEntry(value?.entries.find(x=>x.date===key)||initial(key));};
 const dayKeys=(()=>{
  const [y,m]=month.split("-").map(Number);const start=new Date(Date.UTC(y,m-1,1)),offset=(start.getUTCDay()+6)%7;
  return Array.from({length:42},(_,i)=>dateKey(new Date(Date.UTC(y,m-1,1-offset+i))));
 })();
 function advance(delta:number){const [y,m]=month.split("-").map(Number);setMonth(dateKey(new Date(Date.UTC(y,m-1+delta,1))).slice(0,7))}
 const recorded=new Set(value?.entries.map(e=>e.date)||[]);
 const field=(label:string,val:number|null,key:"energy"|"mood"|"discomfort",min:number)=><View style={s.field} key={key}><Text style={s.label}>{label}</Text>
  <TextInput keyboardType="number-pad" style={s.input} placeholder="Keine Angabe" placeholderTextColor={C.dim}
   value={val==null?"":String(val)} onChangeText={v=>setEntry({...entry,[key]:v===""?null:Number(v)})}/></View>;
 const numberValid=(n:number|null,min:number)=>n===null||(Number.isInteger(n)&&n>=min&&n<=10);
 const entryValid=numberValid(entry.energy,1)&&numberValid(entry.mood,1)&&numberValid(entry.discomfort,0);
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
  <View style={s.header}><Brand compact/><Pressable accessibilityRole="button" onPress={()=>router.back()}><Text style={s.action}>ZURÜCK</Text></Pressable></View>
  <Text style={s.kicker}>FREIWILLIG · PRIVAT</Text><Text style={s.title}>DEIN ZYKLUS.{"\n"}DEINE ENTSCHEIDUNG.</Text>
  <Text style={s.note}>Deine Aufzeichnungen gehören dir. Sie ändern keine Sportstufe und keinen Trainingsplan automatisch.</Text>
  {error?<Text style={s.error} accessibilityRole="alert">{error}</Text>:null}{status?<Text style={s.success}>{status}</Text>:null}
  {!value?<Text style={s.note}>Lade privaten Bereich …</Text>:!value.available?<View style={s.panel}><Text style={s.note}>Der Bereich ist noch nicht freigeschaltet.</Text></View>:!value.enabled?
   <View style={s.panel}><Text style={s.section}>FREIWILLIG TEILNEHMEN</Text>
    <Text style={s.note}>Blutung, Beschwerden und Stimmung sind besonders sensible Angaben. Ohne gesonderte Zustimmung wird nichts erfasst. Trainer haben standardmäßig keinen Zugriff.</Text>
    <Pressable accessibilityRole="checkbox" accessibilityState={{checked:consent}} onPress={()=>setConsent(!consent)} style={s.choice}><Text style={s.choiceText}>{consent?"☑":"□"} Ich stimme der privaten Zyklusaufzeichnung ausdrücklich zu und kann meine Daten jederzeit löschen.</Text></Pressable>
    <Pressable accessibilityRole="button" disabled={!consent||busy} style={[s.primary,(!consent||busy)&&s.inactive]} onPress={()=>change("/api/cycle/preferences","POST",{action:"ENABLE",acknowledgeSensitiveData:true})}><Text style={s.primaryText}>PRIVATEN KALENDER AKTIVIEREN</Text></Pressable>
   </View>:<>
   <View style={s.panel}>
    <Text style={s.section}>DEIN PRIVATER KALENDER</Text><Text style={s.note}>Schätzungen sind ungenau und nicht für Verhütung oder Schwangerschaftsplanung gedacht.</Text>
    <View style={s.monthHead}><Pressable accessibilityRole="button" accessibilityLabel="Vorheriger Monat" onPress={()=>advance(-1)}><Text style={s.monthArrow}>‹</Text></Pressable><Text style={s.monthName}>{month}</Text><Pressable accessibilityRole="button" accessibilityLabel="Nächster Monat" onPress={()=>advance(1)}><Text style={s.monthArrow}>›</Text></Pressable></View>
    <View style={s.calendar}>{["MO","DI","MI","DO","FR","SA","SO"].map(label=><View key={label} style={s.day}><Text style={s.dayText}>{label}</Text></View>)}
     {dayKeys.map(key=><Pressable key={key} accessibilityRole="button" accessibilityLabel={key}
      onPress={()=>select(key)} style={[s.day,recorded.has(key)&&s.recorded,key===date&&s.selected,value.forecast?.estimatedNextStarts.includes(key)&&s.forecastDay]}>
      <Text style={[s.dayText,key===date&&s.selectedText]}>{Number(key.slice(-2))}</Text>
     </Pressable>)}</View>
    {value.forecast?<Text style={s.note}>Ungefähr Tag {value.forecast.day}. Nächster geschätzter Beginn: {value.forecast.estimatedNextStarts[0]}.</Text>:null}
    {value.reminder?<Text style={s.note}>{value.reminder.text}</Text>:null}
   </View>
   <View style={s.panel}><Text style={s.section}>TAGESAUFZEICHNUNG · {date}</Text>
    <Text style={s.label}>BLUTUNG (OPTIONAL)</Text><View style={s.choices}>{flows.map(([code,label])=><Pressable key={code||"empty"} accessibilityRole="button" accessibilityState={{selected:(entry.flow||"")===code}} onPress={()=>setEntry({...entry,flow:code||null})} style={[s.chip,(entry.flow||"")===code&&s.chipOn]}><Text style={s.choiceText}>{label}</Text></Pressable>)}</View>
    {field("ENERGIE (1 bis 10)",entry.energy,"energy",1)}{field("STIMMUNG (1 bis 10)",entry.mood,"mood",1)}{field("BESCHWERDEN (0 bis 10)",entry.discomfort,"discomfort",0)}
    <Text style={s.label}>SYMPTOME (OPTIONAL)</Text><View style={s.choices}>{codes.map(([code,label])=><Pressable key={code} accessibilityRole="checkbox" accessibilityState={{checked:entry.symptoms.includes(code)}} onPress={()=>setEntry({...entry,symptoms:entry.symptoms.includes(code)?entry.symptoms.filter(x=>x!==code):[...entry.symptoms,code]})} style={[s.chip,entry.symptoms.includes(code)&&s.chipOn]}><Text style={s.choiceText}>{entry.symptoms.includes(code)?"✓ ":""}{label}</Text></Pressable>)}</View>
    <Text style={s.label}>WUNSCH FÜR DEIN TRAINING</Text><View style={s.choices}>{choices.map(([code,label])=><Pressable key={code} accessibilityRole="button" accessibilityState={{selected:entry.planChoice===code}} onPress={()=>setEntry({...entry,planChoice:code})} style={[s.chip,entry.planChoice===code&&s.chipOn]}><Text style={s.choiceText}>{label}</Text></Pressable>)}</View>
    <Text style={s.note}>Ein Wunsch ändert keine geplante Einheit. Bei Bedarf mit dem Trainer abstimmen.</Text>
    <Pressable accessibilityRole="button" disabled={busy||!entryValid} style={[s.primary,(!entryValid||busy)&&s.inactive]} onPress={()=>change("/api/cycle/entries","PUT",entry)}><Text style={s.primaryText}>TAG SPEICHERN</Text></Pressable>
    {recorded.has(date)&&<Pressable accessibilityRole="button" onPress={()=>Alert.alert("Eintrag löschen","Diesen Eintrag dauerhaft löschen?",[{text:"Abbrechen"},{text:"Löschen",style:"destructive",onPress:()=>change("/api/cycle/entries","DELETE",{date})}])}><Text style={s.dangerText}>EINTRAG LÖSCHEN</Text></Pressable>}
    <Pressable accessibilityRole="button" onPress={()=>router.push("/(tabs)/training")}><Text style={s.action}>TRAININGSPLAN ANSEHEN</Text></Pressable>
   </View>
   <View style={s.panel}><Text style={s.section}>PRIVATSPHÄRE UND SCHÄTZUNGEN</Text>
    <Text style={s.label}>LETZTER BEGINN (JJJJ-MM-TT)</Text>
    <TextInput style={s.input} value={period} onChangeText={setPeriod} placeholder="2026-10-01" placeholderTextColor={C.dim}/>
    <Text style={s.label}>ZYKLUSLÄNGE (20 bis 45 TAGE)</Text>
    <TextInput style={s.input} keyboardType="number-pad" value={length} onChangeText={setLength}/>
    <Pressable accessibilityRole="button" disabled={busy||Number(length)<20||Number(length)>45||!Number.isInteger(Number(length))}
     style={s.secondary} onPress={()=>change("/api/cycle/preferences","POST",{action:"UPDATE",lastPeriodStart:period||null,cycleLengthDays:Number(length),remindersEnabled:value.remindersEnabled})}>
      <Text style={s.action}>SCHÄTZWERTE SPEICHERN</Text></Pressable>
    <View style={s.switchRow}><Text style={s.note}>Unauffällige Hinweise nur hier zeigen</Text><Switch value={value.remindersEnabled} onValueChange={v=>change("/api/cycle/preferences","POST",{action:"UPDATE",remindersEnabled:v})} disabled={busy} trackColor={{true:C.volt}}/></View>
    <View style={s.switchRow}><Text style={s.note}>Trainingssignale mit zugewiesenem Trainer teilen (letzte 14 Tage, keine Symptome oder Blutung)</Text><Switch value={value.shareWithCoach} disabled={busy}
      onValueChange={v=>{if(!v){void change("/api/cycle/preferences","POST",{action:"SHARE",shareWithCoach:false});return}
       Alert.alert("Separate Trainerfreigabe","Nur Energie, Belastungsempfinden und Wunsch für die letzten 14 Tage teilen?",[{text:"Abbrechen",style:"cancel"},{text:"Ich stimme zu",onPress:()=>change("/api/cycle/preferences","POST",{action:"SHARE",shareWithCoach:true,confirmShare:true})}]);}} trackColor={{true:C.volt}}/></View>
    <Text style={s.note}>Ohne deine Freigabe sieht dein Trainer keine Zykluseinträge.</Text>
   </View>
   <View style={s.panel}><Text style={s.section}>ALLES LÖSCHEN</Text><Text style={s.note}>Alle Zyklusaufzeichnungen, Zustimmungen und Freigaben dauerhaft löschen und das Modul ausschalten.</Text>
    <Pressable accessibilityRole="button" onPress={()=>Alert.alert("Alle Zyklusdaten löschen?","Diese Aktion kann nicht rückgängig gemacht werden.",[{text:"Abbrechen",style:"cancel"},{text:"Alles löschen",style:"destructive",onPress:()=>change("/api/cycle/preferences","POST",{action:"DISABLE",confirmDeletion:true})}])}><Text style={s.dangerText}>ALLE ZYKLUSDATEN ENTFERNEN</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={()=>router.push("/settings")}><Text style={s.action}>DATENEXPORT IN EINSTELLUNGEN</Text></Pressable>
   </View>
  </>}
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:110,gap:14},header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",minHeight:52},kicker:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:1},title:{fontFamily:"Archivo",fontSize:31,lineHeight:35,color:C.ink},note:{fontFamily:"Manrope",fontSize:12,color:C.dim,lineHeight:19,flexShrink:1},panel:{padding:17,borderRadius:11,backgroundColor:"#19231F",borderWidth:1,borderColor:"#3c5145",gap:10},section:{color:C.ink,fontFamily:"Archivo",fontSize:21},label:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:.5,marginTop:9},input:{minHeight:47,padding:11,backgroundColor:"#101915",borderWidth:1,borderColor:"#587060",color:C.ink,borderRadius:8,fontFamily:"Manrope"},primary:{minHeight:48,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",borderRadius:8,padding:10},primaryText:{color:"#131b0c",fontFamily:"ManropeSemiBold",fontSize:11,textAlign:"center"},secondary:{borderWidth:1,borderColor:"#66806b",minHeight:46,alignItems:"center",justifyContent:"center",borderRadius:8},action:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:11},inactive:{opacity:.4},choice:{padding:10,borderWidth:1,borderColor:"#47604f",borderRadius:8},choiceText:{fontFamily:"Manrope",color:C.ink,fontSize:12,lineHeight:18},calendar:{flexDirection:"row",flexWrap:"wrap",gap:"1%"},day:{width:"13.4%",minHeight:40,alignItems:"center",justifyContent:"center",backgroundColor:"#223027",marginBottom:5,borderRadius:6},dayText:{color:C.ink,fontFamily:"Manrope",fontSize:11},selected:{backgroundColor:C.volt},selectedText:{color:"#10180f"},recorded:{borderWidth:1,borderColor:"#a6d7ab"},forecastDay:{borderWidth:2,borderColor:"#efd08d",borderStyle:"dashed"},monthHead:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},monthArrow:{color:C.volt,fontSize:30,minWidth:44,textAlign:"center"},monthName:{color:C.ink,fontFamily:"Archivo",fontSize:19},choices:{flexDirection:"row",flexWrap:"wrap",gap:7},chip:{paddingVertical:9,paddingHorizontal:11,borderWidth:1,borderColor:"#586958",borderRadius:8},chipOn:{backgroundColor:"#3d6034",borderColor:C.volt},field:{gap:5,marginTop:5},switchRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10,paddingVertical:11,borderBottomWidth:1,borderBottomColor:"#304436"},error:{color:"#ffb0b0",fontSize:12},success:{color:C.volt,fontSize:12},dangerText:{color:"#ffaeb7",fontFamily:"ManropeSemiBold",fontSize:12,paddingVertical:12}});
