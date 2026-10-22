import {useCallback,useState} from "react";
import {ActivityIndicator,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from "react-native";
import {useFocusEffect,router} from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {api,API} from "../lib/api";
import {getSession} from "../lib/session";
import {C} from "../theme";

type Workout={id:string;title:string;scheduledAt:string};
type Daily={date:string;dayState:string;actual:{scheduledToday:number;completedToday:number;workout:Workout|null;nextWorkout:Workout|null;energy:number|null;soreness:number|null;sleepMinutes:number|null};recovery:{note:string};coach:{assigned:boolean;openVideos:number;brief:{title:string;body:string|null}|null;adjustments:{title:string;action:string;date:string}[];feedback:{id:string;coachNote:string;nextSession:{focus?:string;advice?:string}|null}[]}};
function when(date:string){return new Date(date).toLocaleString("de-DE")}
export default function Today(){
 const enabled=process.env.EXPO_PUBLIC_JOURNEY_DAILY_ENABLED==="true";
 const [data,setData]=useState<Daily|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[question,setQuestion]=useState("");
 const load=useCallback(async()=>{
  if(!enabled){setLoading(false);return;}
  try{const r=await api<Daily>("/api/journey/daily");setData(r);setError("");}
  catch(e){setError(e instanceof Error?e.message:"Keine Tagesdaten");}
  finally{setLoading(false);}
 },[enabled]);
 useFocusEffect(useCallback(()=>{void load()},[load]));
 async function send(){
  setBusy(true);setError("");setNotice("");
  try{
   const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
   if(!permission.granted)throw Error("Bitte zuerst den Zugriff auf deine Videomediathek erlauben.");
   const pick=await ImagePicker.launchImageLibraryAsync({mediaTypes:["videos"],allowsEditing:false,quality:1});
   if(pick.canceled||!pick.assets[0])return;
   const clip=pick.assets[0];
   const token=await getSession();if(!token)throw Error("Bitte erneut anmelden.");
   const form=new FormData();
   const name=clip.fileName||"technikvideo.mp4";
   form.append("kind","TECHNIQUE_VIDEO");
   form.append("file",{uri:clip.uri,name,type:clip.mimeType||"video/mp4"} as unknown as Blob);
   const upload=await fetch(API+"/api/media",{method:"POST",headers:{Authorization:"Bearer "+token},body:form});
   const up=await upload.json();
   if(!upload.ok)throw Error(up.error||"Video konnte nicht übertragen werden.");
   await api("/api/journey/videos",{method:"POST",body:JSON.stringify({mediaId:up.asset.id,message:question})});
   setNotice("Dein Video wurde deinem Trainer übermittelt.");setQuestion("");await load();
  }catch(e){setError(e instanceof Error?e.message:"Upload fehlgeschlagen.");}finally{setBusy(false);}
 }
 return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={s.content}>
  <Pressable onPress={()=>router.back()}><Text style={s.link}>← ZURÜCK</Text></Pressable>
  <Text style={s.tag}>BE DIFFERENT · HEUTE</Text><Text style={s.title}>DEIN HEUTIGER WEG.</Text>
  {!enabled?<View style={s.card}><Text style={s.p}>Diese Ansicht wird vorbereitet. Dein bestehendes Training bleibt erhalten.</Text></View>:
   loading?<ActivityIndicator color={C.volt}/>:
   <>
    {!!error&&<Text style={s.error}>{error}</Text>}{!!notice&&<Text style={s.tag}>{notice}</Text>}
    {data&&<>
      <View style={s.card}><Text style={s.tag}>{data.date} · DEIN PLAN</Text>
       <Text style={s.heading}>{data.dayState==="TRAINING_PLANNED"?"Training steht an":data.dayState==="TRAINING_DONE"?"Einheit erledigt":"Keine Einheit eingetragen"}</Text>
       <Text style={s.p}>{data.actual.completedToday}/{data.actual.scheduledToday} geplante Einheiten erledigt</Text>
       {data.actual.workout&&<Text style={s.p}>Heute: {data.actual.workout.title}</Text>}
       {data.actual.nextWorkout&&<Text style={s.p}>Nächste Einheit: {data.actual.nextWorkout.title} · {when(data.actual.nextWorkout.scheduledAt)}</Text>}
       <Pressable onPress={()=>router.push("/training")}><Text style={s.link}>TRAINING ANSEHEN →</Text></Pressable>
      </View>
      <View style={s.card}><Text style={s.tag}>ERHOLUNG & CHECKIN</Text>
       <Text style={s.p}>Energie: {data.actual.energy??"Keine Angabe"} · Muskelgefühl: {data.actual.soreness??"Keine Angabe"}</Text>
       <Text style={s.p}>Schlaf: {data.actual.sleepMinutes==null?"Keine Messwerte":Math.round(data.actual.sleepMinutes/6)/10+" Stunden"}</Text>
       <Text style={s.p}>{data.recovery.note}</Text>
       <Pressable onPress={()=>router.push("/lifestyle")}><Text style={s.link}>TAGESCHECK →</Text></Pressable>
      </View>
      <View style={s.card}><Text style={s.tag}>PERSÖNLICHER TRAINER</Text>
       {data.coach.brief&&<Text style={s.p}>{data.coach.brief.title} · {data.coach.brief.body}</Text>}
       {data.coach.adjustments.length===0&&<Text style={s.p}>Noch keine neuen Anweisungen für die nächste Einheit.</Text>}
       {data.coach.adjustments.map((x,i)=><Text key={i} style={s.p}>{x.title} · {x.action}</Text>)}
       {data.coach.feedback.map(f=><View key={f.id} style={s.feedback}><Text style={s.p}>Technikfeedback: {f.coachNote}</Text>
        {f.nextSession&&<Text style={s.p}>{f.nextSession.focus}: {f.nextSession.advice}</Text>}</View>)}
      </View>
      <View style={s.card}><Text style={s.tag}>DEIN TECHNIKVIDEO</Text>
       <Text style={s.p}>Videos sind privat. Der Upload braucht deine Zustimmung zur Verarbeitung und eine PRO Betreuung.</Text>
       <Text style={s.p}>{data.coach.openVideos} Video(s) warten auf Prüfung.</Text>
       {data.coach.assigned?<><TextInput multiline style={s.input} placeholder="Was soll der Trainer ansehen?" placeholderTextColor="#aebdaf" value={question} onChangeText={setQuestion}/>
        <Pressable onPress={send} disabled={busy} style={s.button}><Text style={s.buttonText}>{busy?"WIRD GESENDET …":"VIDEO AUSWÄHLEN & SENDEN"}</Text></Pressable></>:<Text style={s.p}>Noch kein Trainer zugewiesen.</Text>}
      </View>
    </>}
   </>}
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},content:{padding:17,paddingBottom:120,gap:16},
 title:{fontSize:30,color:C.ink,fontFamily:"Archivo"},tag:{color:C.volt,fontSize:11,fontWeight:"900"},
 heading:{fontSize:21,color:C.ink,fontFamily:"Archivo",marginVertical:9},
 card:{backgroundColor:"#16231b",padding:16,borderRadius:12,borderColor:"#526b51",borderWidth:1,gap:10},
 p:{color:"#c3d0c6",lineHeight:20,fontSize:13},
 link:{color:C.volt,fontWeight:"800",fontSize:12},error:{color:"#ffd1d1",backgroundColor:"#402226",padding:12},
 input:{padding:12,color:"#fff",borderWidth:1,borderColor:"#4d6b4f",borderRadius:8,minHeight:60},
 button:{backgroundColor:C.volt,padding:15,borderRadius:8,alignItems:"center"},buttonText:{color:"#0b1309",fontWeight:"900"},
 feedback:{borderTopWidth:1,borderTopColor:"#4b654a",paddingTop:9}
});
