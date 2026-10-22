import {useCallback,useState} from "react";
import {ActivityIndicator,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from "react-native";
import {useFocusEffect,router} from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";
import {api} from "../lib/api";
import {C} from "../theme";

type Metric={key:string;unit:string;min?:number;max?:number};
type Attempt={id:string;verdict:"PENDING"|"PASSED"|"FAILED";feedback:any;submittedAt:string;reviewedAt:string|null};
type Exam={id:string;titleDe:string;kind:string;metrics:Metric[];attempts:Attempt[];canSubmit:boolean;guidanceDe:string;nextRetestAt:string|null};
type Chapter={id:string;titleDe:string;level:string;unlocked:boolean;finished:boolean;mandatoryTotal:number;mandatoryDone:number;
 items:{id:string;titleDe:string;description:string;mandatory:boolean;done:boolean}[];assessment:Exam|null};
type Journey={id:string;state:string;pathway:string;selfLevel:string|null;confirmedLevel:string|null;placement:Exam|null;chapters:Chapter[]};

function ExamCard({exam,enrollmentId,ready,reload}:{exam:Exam;enrollmentId:string;ready:boolean;reload:()=>Promise<void>}){
 const [values,setValues]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState(false),[err,setErr]=useState("");
 const [key,setKey]=useState<string|null>(null);
 const latest=exam.attempts[0];
 const can=ready&&exam.canSubmit&&!busy;
 async function submit(){
  setBusy(true);setErr("");
  try{
   if(exam.metrics.some(m=>!values[m.key]?.trim()||!Number.isFinite(Number(values[m.key]))))
    throw Error("Bitte alle Messwerte eintragen.");
   const token=key??"journey-"+Date.now()+"-"+Math.floor(Math.random()*1000000);
   setKey(token);
   await api("/api/journey/tests/attempts",{method:"POST",body:JSON.stringify({
    assessmentId:exam.id,enrollmentId,idempotencyKey:token,
    results:exam.metrics.map(m=>({key:m.key,unit:m.unit,value:Number(values[m.key])}))
   })});
   setKey(null);setValues({});await reload();
  }catch(e){setErr(e instanceof Error?e.message:"Bitte erneut versuchen.");}finally{setBusy(false);}
 }
 return <View style={s.exam}>
  <Text style={s.examTitle}>{exam.titleDe}</Text>
  {latest&&<View style={[s.feedback,latest.verdict==="FAILED"&&s.failed]}>
   <Text style={s.accent}>{latest.verdict==="PENDING"?"TRAINER PRÜFT":latest.verdict==="PASSED"?"BESTANDEN":"NOCH NICHT BESTANDEN"}</Text>
   {latest.verdict==="PENDING"&&<Text style={s.hint}>Dein Trainer prüft die Messwerte.</Text>}
   {latest.verdict==="PASSED"&&<Text style={s.hint}>Dein Fortschritt wurde bestätigt. Der nächste Abschnitt ist frei, sobald die Voraussetzungen erfüllt sind.</Text>}
   {latest.verdict==="FAILED"&&<><Text style={s.hint}>Du kannst gezielt an diesen Punkten weiterarbeiten:</Text>
    {Array.isArray(latest.feedback?.missing)&&latest.feedback.missing.map((m:string)=><Text key={m} style={s.hint}>Fehlender Messwert: {m}</Text>)}
    {Array.isArray(latest.feedback?.failed)&&latest.feedback.failed.map((f:{key:string;expected:string;actual:number},i:number)=>
     <Text key={i} style={s.hint}>{f.key}: {f.actual} · Ziel {f.expected}</Text>)}
    {!!exam.guidanceDe&&<Text style={s.hint}>{exam.guidanceDe}</Text>}
   </>}
   {!!latest.feedback?.coachFeedbackDe&&<Text style={s.hint}>Trainer: {String(latest.feedback.coachFeedbackDe)}</Text>}
  </View>}
  {can&&<><View style={s.metrics}>{exam.metrics.map(metric=><View key={metric.key} style={s.metric}>
   <Text style={s.hint}>{metric.key} ({metric.unit})</Text>
   <Text style={s.small}>{metric.min!==undefined?"Ab "+metric.min+" ":""}{metric.max!==undefined?"Bis "+metric.max:""}</Text>
   <TextInput style={s.input} keyboardType="numeric" placeholder="Wert" placeholderTextColor="#809084"
    value={values[metric.key]??""} onChangeText={v=>setValues(old=>({...old,[metric.key]:v}))}/>
  </View>)}</View><Pressable disabled={busy} accessibilityRole="button" onPress={submit} style={s.btn}>
   <Text style={s.btnText}>{busy?"SPEICHERN …":"TEST EINREICHEN"}</Text></Pressable></>}
  {!can&&exam.nextRetestAt&&new Date(exam.nextRetestAt)>new Date()&&
   <Text style={s.hint}>Nächster Versuch frühestens: {new Date(exam.nextRetestAt).toLocaleString("de-DE")}</Text>}
  {!!err&&<Text style={s.err}>{err}</Text>}
 </View>;
}
export default function JourneyTests(){
 const [data,setData]=useState<Journey[]>([]),[loading,setLoading]=useState(true);
 const [err,setErr]=useState(""),[busy,setBusy]=useState("");
 const enabled=process.env.EXPO_PUBLIC_JOURNEY_TESTS_ENABLED!=="false";
 const refresh=useCallback(async()=>{
  if(!enabled){setLoading(false);return;}
  try{const v=await api<{enrollments:Journey[]}>("/api/journey/tests");setData(v.enrollments);setErr("");}
  catch(e){setErr(e instanceof Error?e.message:"Nicht verfügbar.");}
  finally{setLoading(false);}
 },[enabled]);
 useFocusEffect(useCallback(()=>{void refresh()},[refresh]));
 async function finish(enrollmentId:string,itemId:string){
  setBusy(itemId);setErr("");
  try{await api("/api/journey/tests/items",{method:"POST",body:JSON.stringify({enrollmentId,itemId})});await refresh();}
  catch(e){setErr(e instanceof Error?e.message:"Nicht möglich.");}
  finally{setBusy("");}
 }
 return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={s.content}>
  <Pressable onPress={()=>router.back()}><Text style={s.back}>← ZURÜCK</Text></Pressable>
  <Text style={s.eyebrow}>BE DIFFERENT · TRAININGSWEG</Text><Text style={s.title}>DEIN NÄCHSTER SCHRITT.</Text>
  <Text style={s.hint}>Deine Leistungsstufe wird durch Prüfungen und den Trainer bestätigt, nicht durch deine Punkte oder ein PRO Abo.</Text>
  {!enabled?<View style={s.card}><Text style={s.hint}>Der neue Trainingsweg wird vorbereitet. Dein bisheriges Training bleibt unverändert.</Text></View>:
   loading?<ActivityIndicator color={C.volt}/>:
   <>{!!err&&<Text style={s.err}>{err}</Text>}
    {!data.length&&<View style={s.card}><Text style={s.hint}>Noch kein zugeordneter Trainingsweg. Die Auswahl deiner Ziele bleibt gespeichert.</Text></View>}
    {data.map(e=><View key={e.id} style={s.card}>
     <Text style={s.eyebrow}>{e.pathway}</Text><Text style={s.subtitle}>{e.confirmedLevel?.replaceAll("_"," ")??"EINSTUFUNG AUSSTEHEND"}</Text>
     {e.state==="PENDING"&&<View style={s.chapter}><Text style={s.subtitle}>Dein Einstieg</Text>
      {e.placement?<ExamCard exam={e.placement} enrollmentId={e.id} ready reload={refresh}/>:
       <Text style={s.hint}>Der Trainer bestätigt dein Startlevel.</Text>}
     </View>}
     {e.chapters.map(ch=><View key={ch.id} style={[s.chapter,!ch.unlocked&&s.locked]}>
      <Text style={s.accent}>{ch.level.replaceAll("_"," ")}</Text><Text style={s.subtitle}>{ch.titleDe}</Text>
      <Text style={s.small}>{ch.finished?"BESTANDEN":ch.unlocked?"FREIGESCHALTET":"GESPERRT"}</Text>
      {ch.unlocked?<><Text style={s.hint}>{ch.mandatoryDone}/{ch.mandatoryTotal} Pflichtinhalte abgeschlossen</Text>
       {ch.items.map(it=><View key={it.id} style={s.item}><Text style={s.itemTitle}>{it.titleDe}</Text>
        {!!it.description&&<Text style={s.hint}>{it.description}</Text>}
        <Pressable disabled={it.done||busy===it.id||ch.finished} onPress={()=>finish(e.id,it.id)} style={s.outline}>
         <Text style={s.small}>{it.done?"ERLEDIGT":busy===it.id?"SPEICHERN …":"ALS ERLEDIGT MARKIEREN"}</Text></Pressable>
       </View>)}
       {ch.assessment&&<ExamCard exam={ch.assessment} enrollmentId={e.id} ready={!ch.finished&&ch.mandatoryDone===ch.mandatoryTotal} reload={refresh}/>}
      </>:<Text style={s.hint}>Erst die vorherigen Kapitel und Tests abschließen.</Text>}
     </View>)}
    </View>)}
   </>}
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:120,gap:16},
 back:{color:C.volt,fontSize:12,fontWeight:"800"},eyebrow:{color:C.volt,fontSize:11,letterSpacing:1.4,fontWeight:"800"},
 title:{color:C.ink,fontSize:32,fontFamily:"Archivo"},subtitle:{color:C.ink,fontSize:21,fontFamily:"Archivo",marginVertical:8},
 hint:{color:"#b3bfb7",fontSize:12,lineHeight:19,marginVertical:7},small:{color:"#c7d0c5",fontSize:11},
 accent:{color:C.volt,fontSize:12,fontWeight:"900"},card:{backgroundColor:"#131d19",borderColor:"#405749",borderWidth:1,borderRadius:15,padding:18,gap:11},
 chapter:{borderWidth:1,borderColor:"#3d4d41",backgroundColor:"#1b2520",padding:13,borderRadius:11,marginTop:11},
 locked:{opacity:.58},item:{backgroundColor:"#17211b",borderRadius:8,padding:11,marginTop:8,gap:7},
 itemTitle:{color:"#eef6e9",fontSize:14,fontWeight:"700"},outline:{borderWidth:1,borderColor:"#52674f",padding:12,borderRadius:7,marginTop:8},
 exam:{marginTop:17,borderTopWidth:1,borderTopColor:"#50644c",paddingTop:14},
 examTitle:{color:C.ink,fontSize:17,fontWeight:"900"},feedback:{backgroundColor:"#203525",padding:12,borderRadius:8,marginVertical:12},
 failed:{backgroundColor:"#332b22"},metrics:{gap:8,marginVertical:11},metric:{gap:4},
 input:{height:49,borderRadius:7,borderWidth:1,borderColor:"#5a715e",backgroundColor:"#101812",color:C.ink,paddingHorizontal:12,fontSize:17},
 btn:{backgroundColor:C.volt,borderRadius:7,padding:15,alignItems:"center",marginTop:13},
 btnText:{color:"#101609",fontSize:12,fontWeight:"900"},err:{color:"#ffacb3",backgroundColor:"#371c24",padding:12,borderRadius:7}
});
