import {useCallback,useEffect,useState} from "react";
import {ActivityIndicator,Image,Pressable,ScrollView,StyleSheet,Text,View} from "react-native";
import {useFocusEffect,router} from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";
import {useVideoPlayer,VideoView} from "expo-video";
import {api,API} from "../lib/api";
import {getSession} from "../lib/session";
import {C} from "../theme";
type Preview={id:string;titleDe:string;position:number;unlocked:boolean;finished:boolean;mandatoryDone:number|null;mandatoryTotal:number|null};
type Level={code:string;description:string;earned:boolean;chapters:Preview[]};
type Journey={id:string;pathway:string;state:string;confirmedLevel:string|null;completedChapters:number;totalChapters:number;levels:Level[]};
type Overview={enrollments:Journey[];intake:{status:string;goals:string[]}|null;legacy:{workoutCount:number;transitionAvailable:boolean};
 goals:{slug:string;label:string}[];levels:{code:string;description:string}[];testsEnabled:boolean};
type Media={role:string;presenter:string;proOnly:boolean;available:boolean;url:string|null};
type Detail={id:string;enrollmentId:string;titleDe:string;level:string;description:string;finished:boolean;
 mandatoryDone:number;mandatoryTotal:number;items:{id:string;titleDe:string;kind:string;description:string;mandatory:boolean;done:boolean;
 exercise:{nameDe:string;equipment:string|null;coachTips:string[]}|null;trainingPlan:{name:string;description:string|null}|null;media:Media[]}[];test:{titleDe:string}|null};
function Clip({media,token}:{media:Media;token:string|null}){
 const isVideo=media.role==="EXPLANATION_VIDEO";
 const source=media.available&&media.url&&token?{uri:API+media.url,headers:{Authorization:"Bearer "+token}}:null;
 const player=useVideoPlayer(source);
 return <View style={s.media}>
  <Text style={s.tag}>{media.presenter==="TRAINER"?"TRAINERIN":"TRAINER"} · {isVideo?"ERKLÄRVIDEO":"ÜBUNGSBILD"}</Text>
  {!source?<Text style={s.muted}>{media.proOnly?"Mit PRO verfügbar.":"Aufnahme derzeit nicht verfügbar."}</Text>:
   isVideo?<VideoView player={player} style={s.preview} nativeControls/>:
    <Image style={s.preview} source={{uri:API+media.url!,headers:{Authorization:"Bearer "+token}}} resizeMode="contain"/>}
 </View>;
}
export default function JourneyOverview(){
 const enabled=process.env.EXPO_PUBLIC_JOURNEY_OVERVIEW_ENABLED==="true";
 const [data,setData]=useState<Overview|null>(null),[detail,setDetail]=useState<Detail|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [goals,setGoals]=useState<string[]>([]),[level,setLevel]=useState("READY"),[approved,setApproved]=useState(false),[token,setToken]=useState<string|null>(null);
 const load=useCallback(async()=>{
  if(!enabled){setLoading(false);return;}
  try{const response=await api<Overview>("/api/journey/overview");setData(response);setError("");setToken(await getSession());}
  catch(e){setError(e instanceof Error?e.message:"Trainingsweg nicht verfügbar.");}
  finally{setLoading(false);}
 },[enabled]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 async function open(enrollmentId:string,chapter:Preview){
  if(!chapter.unlocked)return;setBusy(true);setError("");
  try{const response=await api<{chapter:Detail}>("/api/journey/chapters/"+chapter.id+"?enrollmentId="+enrollmentId);setDetail(response.chapter);}
  catch(e){setError(e instanceof Error?e.message:"Kapitel gesperrt");}finally{setBusy(false);}
 }
 async function mark(itemId:string){
  if(!detail)return;setBusy(true);setError("");
  try{
   await api("/api/journey/tests/items",{method:"POST",body:JSON.stringify({enrollmentId:detail.enrollmentId,itemId})});
   const response=await api<{chapter:Detail}>("/api/journey/chapters/"+detail.id+"?enrollmentId="+detail.enrollmentId);
   setDetail(response.chapter);await load();
  }catch(e){setError(e instanceof Error?e.message:"Nicht gespeichert");}finally{setBusy(false);}
 }
 async function transition(){
  setBusy(true);setError("");
  try{await api("/api/journey/legacy-transition",{method:"POST",body:JSON.stringify({
   goals,selfLevel:level,confirmLegacyPreservation:true
  })});await load();}
  catch(e){setError(e instanceof Error?e.message:"Wechsel nicht möglich");}finally{setBusy(false);}
 }
 return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={s.content}>
  <Pressable onPress={()=>router.back()}><Text style={s.back}>← ZURÜCK</Text></Pressable>
  <Text style={s.eyebrow}>BE DIFFERENT · DEIN WEG</Text><Text style={s.title}>DEIN FORTSCHRITT.</Text>
  <Text style={s.muted}>Deine bestätigten Leistungsstufen und Kapitel. Punkte und PRO ersetzen keine Aufstiegstests.</Text>
  {!enabled?<View style={s.card}><Text style={s.muted}>Der neue Trainingsweg wird vorbereitet. Deine bisherigen Daten bleiben erhalten.</Text></View>:
   loading?<ActivityIndicator color={C.volt}/>:
   <>{!!error&&<Text style={s.error}>{error}</Text>}
    {data?.intake&&<View style={s.card}><Text style={s.tag}>DEINE AUSWAHL</Text>
     <Text style={s.muted}>{data.intake.goals.map(x=>data.goals.find(g=>g.slug===x)?.label??x).join(" + ")}</Text>
     <Text style={s.muted}>{data.intake.status==="PENDING_PATHWAY"?"Dein Weg wird vorbereitet.":data.intake.status==="PENDING_PLACEMENT"?"Deine Einstufung ist noch offen.":"Einstieg bestätigt."}</Text>
    </View>}
    {data?.legacy.transitionAvailable&&data.enrollments.length===0&&<View style={s.card}>
     <Text style={s.subtitle}>FREIWILLIGER WECHSEL</Text><Text style={s.muted}>Deine bisherigen Trainingspläne, Einheiten, Punkte und Abzeichen bleiben unverändert.</Text>
     <Text style={s.tag}>ZIELE KOMBINIEREN</Text>
     {data.goals.map(g=><Pressable accessibilityRole="checkbox" accessibilityState={{checked:goals.includes(g.slug)}}
       style={s.option} key={g.slug} onPress={()=>setGoals(old=>old.includes(g.slug)?old.filter(x=>x!==g.slug):[...old,g.slug])}>
       <Text style={s.optionText}>{goals.includes(g.slug)?"✓  ":"○  "}{g.label}</Text></Pressable>)}
     <Text style={s.tag}>SELBSTEINSCHÄTZUNG</Text>
     <View style={s.levelPills}>{data.levels.map(l=><Pressable key={l.code} onPress={()=>setLevel(l.code)}
       style={[s.pill,level===l.code&&s.pillOn]}><Text style={s.small}>{l.code.replaceAll("_"," ")}</Text></Pressable>)}</View>
     <Pressable accessibilityRole="checkbox" accessibilityState={{checked:approved}} onPress={()=>setApproved(!approved)} style={s.option}>
      <Text style={s.muted}>{approved?"✓  ":"○  "}Ich möchte den neuen Weg beginnen, ohne alte Daten zu überschreiben.</Text></Pressable>
     <Pressable disabled={busy||!approved||!goals.length} style={[s.btn,(!approved||!goals.length)&&s.disabled]} onPress={transition}>
      <Text style={s.btnText}>WECHSEL VORMERKEN</Text></Pressable>
    </View>}
    {data?.enrollments.map(e=><View key={e.id} style={s.card}>
     <Text style={s.tag}>{e.pathway} · {e.completedChapters}/{e.totalChapters} KAPITEL</Text>
     <Text style={s.subtitle}>{e.confirmedLevel?.replaceAll("_"," ")||"EINSTUFUNG AUSSTEHEND"}</Text>
     {e.levels.map(l=><View key={l.code} style={s.levelCard}>
      <Text style={s.subtitle}>{l.code.replaceAll("_"," ")}</Text>
      <Text style={s.muted}>{l.description}</Text><Text style={s.tag}>{l.earned?"ERREICHT":"NOCH NICHT ERREICHT"}</Text>
      {l.chapters.map(ch=><Pressable key={ch.id} disabled={!ch.unlocked||busy} onPress={()=>open(e.id,ch)} style={[s.option,!ch.unlocked&&s.disabled]}>
       <Text style={s.optionText}>{ch.position}. {ch.titleDe}</Text>
       <Text style={s.small}>{ch.finished?"ABGESCHLOSSEN":ch.unlocked?String(ch.mandatoryDone)+"/"+ch.mandatoryTotal+" PFLICHTINHALTE":"GESPERRT"}</Text>
      </Pressable>)}
     </View>)}
     {data.testsEnabled&&<Pressable style={s.btn} onPress={()=>router.push("/journey-tests")}><Text style={s.btnText}>KAPITELTESTS ÖFFNEN →</Text></Pressable>}
    </View>)}
    {detail&&<View style={s.card}><Pressable onPress={()=>setDetail(null)}><Text style={s.back}>× SCHLIESSEN</Text></Pressable>
     <Text style={s.tag}>{detail.level.replaceAll("_"," ")} · FREIGESCHALTET</Text><Text style={s.subtitle}>{detail.titleDe}</Text>
     <Text style={s.muted}>{detail.description}</Text><Text style={s.muted}>{detail.mandatoryDone}/{detail.mandatoryTotal} Pflichtinhalte erledigt</Text>
     {detail.items.map(item=><View key={item.id} style={s.levelCard}>
      <Text style={s.tag}>{item.kind==="EXERCISE"?"ÜBUNG":item.kind==="TRAINING_PLAN"?"TRAININGSPLAN":"ANLEITUNG"}</Text>
      <Text style={s.subtitle}>{item.titleDe}</Text><Text style={s.muted}>{item.description}</Text>
      {item.exercise&&<><Text style={s.muted}>{item.exercise.nameDe}</Text>{item.exercise.coachTips.map((tip,i)=><Text style={s.muted} key={i}>{tip}</Text>)}</>}
      {item.trainingPlan&&<Text style={s.muted}>{item.trainingPlan.name}</Text>}
      {item.media.map((m,i)=><Clip key={i} media={m} token={token}/>)}
      {data?.testsEnabled&&<Pressable disabled={busy||item.done||detail.finished} style={[s.btn,item.done&&s.disabled]} onPress={()=>mark(item.id)}><Text style={s.btnText}>{item.done?"ERLEDIGT":"ALS ERLEDIGT MARKIEREN"}</Text></Pressable>}
     </View>)}
     {detail.test&&data?.testsEnabled&&<Pressable style={s.btn} onPress={()=>router.push("/journey-tests")}><Text style={s.btnText}>KAPITELTEST: {detail.test.titleDe} →</Text></Pressable>}
    </View>}
   </>}
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},content:{padding:17,paddingBottom:130,gap:14},
 back:{color:C.volt,fontSize:12,fontWeight:"800"},eyebrow:{color:C.volt,letterSpacing:1.4,fontSize:11},
 title:{fontFamily:"Archivo",fontSize:32,color:C.ink},subtitle:{fontFamily:"Archivo",fontSize:20,color:C.ink,marginVertical:7},
 muted:{color:"#b4c5b6",fontSize:12,lineHeight:19,marginVertical:6},small:{color:"#c2d2c0",fontSize:10},
 card:{backgroundColor:"#14221a",borderRadius:13,borderWidth:1,borderColor:"#49644c",padding:16,gap:11},
 levelCard:{padding:12,borderWidth:1,borderRadius:9,borderColor:"#4b604d",marginTop:8},
 tag:{color:C.volt,fontSize:10,fontWeight:"800"},option:{padding:14,backgroundColor:"#1b2b20",borderRadius:8,borderWidth:1,borderColor:"#536a53",gap:7},
 optionText:{color:C.ink,fontSize:13,fontWeight:"700"},disabled:{opacity:.5},btn:{backgroundColor:C.volt,padding:14,borderRadius:8,marginTop:9,alignItems:"center"},
 btnText:{color:"#111911",fontSize:12,fontWeight:"900"},error:{color:"#ffc5c5",backgroundColor:"#432025",padding:12,borderRadius:8},
 levelPills:{flexDirection:"row",flexWrap:"wrap",gap:8},pill:{borderWidth:1,borderColor:"#5b7158",borderRadius:7,padding:9},pillOn:{backgroundColor:"#3a5b2e"},
 media:{marginTop:12,padding:10,borderRadius:8,borderWidth:1,borderColor:"#455944"},preview:{width:"100%",height:235,marginTop:9}
});
