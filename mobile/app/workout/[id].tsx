
import {Copy,ExerciseName,LocalizedTextInput} from "../../components/Locale";


import {useEffect,useState} from "react";
import {ActivityIndicator,AppState,Image,Modal,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,TextInput,View,Vibration} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {ChevronLeft} from "lucide-react-native";
import {API,api,ApiError} from "../../lib/api";
import {enqueue,flushOutbox} from "../../lib/offline";import {localMediaUri,preloadCurrentPlanMedia} from "../../lib/media-cache";
import Animated,{FadeIn,FadeInDown,FadeInUp,ZoomIn} from "react-native-reanimated";
import {useVideoPlayer,VideoView} from "expo-video";
import {C,radius} from "../../theme";


function TechniqueModal({item,media,onClose}:{item:any;media:Record<string,string>;onClose:()=>void}){
 const videoUrl=item?.videoUrl?(media[item.videoUrl]||(item.videoUrl.startsWith("http")?item.videoUrl:API+item.videoUrl)):null;
 const player=useVideoPlayer(videoUrl||null,p=>{if(videoUrl){p.loop=true;p.muted=true;p.play()}});
 const images=[item?.imageStart,item?.imageMiddle,item?.imageEnd].filter(Boolean);
 return <Modal visible={Boolean(item)} transparent animationType="slide" onRequestClose={onClose}><SafeAreaView style={s.modalSafe}><View style={s.modalHead}><Text style={s.modalTitle}>{item?.nameDe||"TECHNIK"}</Text><Pressable onPress={onClose}><Text style={s.modalClose}><Copy text={"SCHLIESSEN"}/></Text></Pressable></View><ScrollView contentContainerStyle={s.modalContent}>
  <View style={s.modalImages}>{images.map((u:any,i:number)=><Image key={u} source={{uri:media[u]||(u.startsWith("http")?u:API+u)}} style={s.modalImage}/>)}</View>
  {videoUrl?<VideoView style={s.modalVideo} player={player} nativeControls contentFit="cover"/>:<Text style={s.modalHint}><Copy text={"Für diese Übung ist noch kein Trainervideo hinterlegt."}/></Text>}
  <Text style={s.modalHint}>{item?.coachCue1||""}</Text><Text style={s.modalHint}>{item?.coachCue2||""}</Text><Text style={s.modalHint}>{item?.coachCue3||""}</Text>
 </ScrollView></SafeAreaView></Modal>;
}

export default function Workout(){
 const {id}=useLocalSearchParams<{id:string}>();
 const [w,setW]=useState<any>(null);
 const [loadError,setLoadError]=useState("");
 const [sets,setSets]=useState<Record<string,{weightKg?:string;reps?:string;rpe?:string;done?:boolean;queued?:boolean}>>({});
 const [finishing,setFinishing]=useState(false);
 const [rest,setRest]=useState(0);
 const [media,setMedia]=useState<Record<string,string>>({});
 const [previous,setPrevious]=useState<Record<string,{weightKg:number|null;reps:number|null;rpe:number|null}>>({});
 const [finishOpen,setFinishOpen]=useState(false);
 const [finishRpe,setFinishRpe]=useState(8);
 const [finishNote,setFinishNote]=useState("");
 const [achievement,setAchievement]=useState("");
 const [technique,setTechnique]=useState<any>(null);

 useEffect(()=>{api<any>(`/api/workouts/${id}`).then(async x=>{setW(x.workout);setPrevious(x.previousSets||{});const init:any={};for(const we of x.workout.exercises){for(let i=1;i<=we.targetSets;i++){const key=`${we.exerciseId}:${i}`,old=x.previousSets?.[key];init[key]={weightKg:old?.weightKg==null?"":String(old.weightKg),reps:old?.reps==null?"":String(old.reps),rpe:"",done:false};}}for(const s of x.workout.sets)init[`${s.exerciseId}:${s.setNumber}`]={weightKg:String(s.weightKg??""),reps:String(s.reps??""),rpe:String(s.rpe??""),done:true};setSets(init);const urls=x.workout.exercises.flatMap((we:any)=>[we.exercise.imageStart,we.exercise.imageMiddle,we.exercise.imageEnd,we.exercise.videoUrl]).filter(Boolean);const pairs=await Promise.all(urls.map(async (u:string)=>[u,await localMediaUri(u)] as const));setMedia(Object.fromEntries(pairs));}).catch(e=>setLoadError(e.message||"Training konnte nicht geladen werden."));api(`/api/workouts/${id}`,{method:"PATCH",body:JSON.stringify({action:"start"})}).catch(()=>{});flushOutbox();preloadCurrentPlanMedia().catch(()=>undefined);const sub=AppState.addEventListener("change",state=>{if(state==="active"){flushOutbox();preloadCurrentPlanMedia().catch(()=>undefined)}});return()=>sub.remove()},[id]);
 useEffect(()=>{if(rest<=0)return;const t=setInterval(()=>setRest(x=>Math.max(0,x-1)),1000);return()=>clearInterval(t)},[rest]);

 async function save(exId:string,n:number,restSeconds:number){
   const key=`${exId}:${n}`,x=sets[key]||{};
   const body={exerciseId:exId,setNumber:n,weightKg:x.weightKg?.trim()?Number(x.weightKg.replace(",",".")):undefined,reps:x.reps?.trim()?Number(x.reps):undefined,rpe:x.rpe?.trim()?Number(x.rpe):undefined};
   try{const result:any=await api(`/api/workouts/${id}/sets`,{method:"POST",body:JSON.stringify(body)});setSets(current=>({...current,[key]:{...x,done:true,queued:false}}));if(result.personalRecord){setAchievement("NEUER PERSÖNLICHER REKORD");Vibration.vibrate([100,60,170,60,230]);setTimeout(()=>setAchievement(""),2800)}else Vibration.vibrate(35)}
   catch(error){if(error instanceof ApiError&&error.status<500){setAchievement(error.message);return}await enqueue(`/api/workouts/${id}/sets`,body);setSets(current=>({...current,[key]:{...x,done:true,queued:true}}));Vibration.vibrate(35)}
   setRest(restSeconds);
 }

 async function finish(){
   setFinishing(true);const flushed=await flushOutbox();
   if(flushed.remaining){setFinishing(false);setAchievement("OFFLINE DATEN WERDEN NOCH GESPEICHERT");return}
   await api(`/api/workouts/${id}`,{method:"PATCH",body:JSON.stringify({action:"complete",rpe:finishRpe,notes:finishNote||undefined})}).then(()=>{Vibration.vibrate([80,50,130]);router.replace("/(tabs)")}).catch(error=>{setFinishing(false);setAchievement(error.message||"Training konnte nicht abgeschlossen werden.")});
 }

 if(loadError)return <SafeAreaView style={s.center}><Text style={s.cue}>{loadError}</Text><Pressable onPress={()=>router.back()}><Text style={s.skip}><Copy text={"ZURÜCK"}/></Text></Pressable></SafeAreaView>;
 if(!w)return <View style={s.center}><ActivityIndicator color={C.volt}/></View>;
 return <SafeAreaView style={s.safe}><TechniqueModal item={technique} media={media} onClose={()=>setTechnique(null)}/>
  <Animated.View entering={FadeInDown.duration(380)} style={s.top}><Pressable onPress={()=>router.back()}><ChevronLeft color={C.ink}/></Pressable><Text style={s.topText}><Copy text={"TRAININGSMODUS"}/></Text><Text style={s.ready}><Copy text={"● AKTIV"}/></Text></Animated.View>
  {achievement?<Animated.View entering={ZoomIn.duration(220)} style={s.achievement}><Text style={s.achievementText}>{achievement}</Text></Animated.View>:null}
  {rest>0&&<Animated.View entering={ZoomIn.duration(260)} style={s.restTimer}><Text style={s.restLabel}><Copy text={"PAUSE"}/></Text><Text style={s.restValue}>{Math.floor(rest/60)}:{String(rest%60).padStart(2,"0")}</Text><Pressable onPress={()=>setRest(0)}><Text style={s.skip}><Copy text={"ÜBERSPRINGEN"}/></Text></Pressable></Animated.View>}
  <ScrollView contentContainerStyle={s.content}>
   <Animated.Text entering={FadeInUp.delay(80).duration(460)} style={s.title}>{w.title}</Animated.Text><Animated.Text entering={FadeIn.delay(180).duration(420)} style={s.meta}>{w.exercises.length}<Copy text={"ÜBUNGEN · JEDEN SATZ ERFASSEN"}/></Animated.Text>
   {w.exercises.map((we:any,index:number)=><Animated.View entering={FadeInDown.delay(Math.min(index*70,420)).duration(480)} style={s.exercise} key={we.id}>
    <Text style={s.nr}>{String(index+1).padStart(2,"0")}</Text><Text style={s.name}><ExerciseName exercise={we.exercise}/></Text><Text style={s.cue}>{we.exercise.coachCue1||"Kontrolliert und sauber ausführen."}</Text><View style={s.mediaRow}>{[we.exercise.imageStart,we.exercise.imageMiddle,we.exercise.imageEnd].map((u:any,i:number)=>u?<Image key={u} source={{uri:media[u]||(u.startsWith("http")?u:API+u)}} style={s.media}/>:<View key={i} style={s.mediaEmpty}><Text style={s.mediaEmptyText}>{["BEGINN","MITTE","ENDE"][i]}</Text></View>)}</View><Pressable style={s.technique} onPress={()=>setTechnique(we.exercise)}><Text style={s.techniqueText}><Copy text={"TECHNIK UND VIDEO →"}/></Text></Pressable>
    {Array.from({length:we.targetSets},(_,i)=>{const n=i+1,key=`${we.exerciseId}:${n}`,x=sets[key]||{},old=previous[key];return <Animated.View entering={FadeInDown.delay(Math.min(220+i*45,520)).duration(360)} style={s.set} key={key}><Text style={s.setNr}>{n}</Text><TextInput style={s.input} value={x.weightKg||""} onChangeText={v=>setSets({...sets,[key]:{...x,weightKg:v}})} keyboardType="decimal-pad" placeholder={old?.weightKg==null?"kg":String(old.weightKg)+" kg"} placeholderTextColor="#555"/><LocalizedTextInput style={s.input} value={x.reps||""} onChangeText={v=>setSets({...sets,[key]:{...x,reps:v}})} keyboardType="number-pad" placeholder={old?.reps==null?"Wdh":String(old.reps)+" Wdh"} placeholderTextColor="#555"/><TextInput style={s.rpe} value={x.rpe||""} onChangeText={v=>setSets({...sets,[key]:{...x,rpe:v}})} keyboardType="number-pad" placeholder="RPE" placeholderTextColor="#555"/><Pressable style={[s.done,x.done&&s.doneOn]} onPress={()=>save(we.exerciseId,n,we.restSeconds)}><Text style={[s.doneText,x.done&&s.doneTextOn]}><Copy text={x.queued?"W":x.done?"✓":"SPEICHERN"}/></Text></Pressable></Animated.View>})}
    <Text style={s.rest}><Copy text={"PAUSE"}/>{we.restSeconds}s</Text>
   </Animated.View>)}
   {finishOpen?<Animated.View entering={FadeInUp.duration(300)} style={s.finishPanel}><Text style={s.finishQuestion}><Copy text={"WIE HART WAR DIE EINHEIT?"}/></Text><Text style={s.finishHint}><Copy text={"RPE VON 1 BIS 10"}/></Text><View style={s.rpeChoices}>{[1,2,3,4,5,6,7,8,9,10].map(n=><Pressable key={n} onPress={()=>setFinishRpe(n)} style={[s.rpeChoice,n===finishRpe&&s.rpeChoiceOn]}><Text style={[s.rpeChoiceText,n===finishRpe&&s.rpeChoiceTextOn]}>{n}</Text></Pressable>)}</View><LocalizedTextInput style={s.finishNote} value={finishNote} onChangeText={setFinishNote} placeholder="Notiz zur Einheit optional" placeholderTextColor="#666" multiline/><View style={s.finishActions}><Pressable style={s.cancelFinish} onPress={()=>setFinishOpen(false)}><Text style={s.cancelFinishText}><Copy text={"ZURÜCK"}/></Text></Pressable><Pressable style={s.finishConfirm} onPress={finish} disabled={finishing}><Text style={s.finishText}><Copy text={finishing?"WIRD GESPEICHERT":"ABSCHLIESSEN →"}/></Text></Pressable></View></Animated.View>:<Animated.View entering={FadeInUp.delay(220).duration(480)}><Pressable style={s.finish} onPress={()=>setFinishOpen(true)}><Text style={s.finishText}><Copy text={"TRAINING ABSCHLIESSEN →"}/></Text></Pressable></Animated.View>}
  </ScrollView>
 </SafeAreaView>
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},center:{flex:1,backgroundColor:C.bg,alignItems:"center",justifyContent:"center"},top:{height:62,paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:C.line},topText:{color:C.dim,fontSize:9,fontWeight:"900",letterSpacing:1.5},ready:{color:C.green,fontSize:8,fontWeight:"900"},content:{padding:16,paddingBottom:130},title:{color:C.ink,fontSize:43,lineHeight:40,fontWeight:"900",letterSpacing:-2.5,marginTop:10},meta:{color:C.dim,fontSize:9,fontWeight:"800",letterSpacing:1,marginTop:9,marginBottom:18},exercise:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:radius.lg,padding:18,marginBottom:12},nr:{color:"#343936",fontSize:30,fontWeight:"900"},name:{color:C.ink,fontSize:25,fontWeight:"900",letterSpacing:-1,marginTop:3},cue:{color:C.dim,fontSize:12,lineHeight:18,marginVertical:14},set:{flexDirection:"row",alignItems:"center",gap:6,marginBottom:7},setNr:{width:20,color:C.dim,fontSize:10,fontWeight:"900"},input:{flex:1,height:44,borderRadius:12,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line,color:C.ink,paddingHorizontal:7,textAlign:"center"},rpe:{width:50,height:44,borderRadius:12,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line,color:C.ink,paddingHorizontal:5,textAlign:"center"},done:{width:50,height:44,borderRadius:12,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},doneOn:{backgroundColor:C.volt,borderColor:C.volt},doneText:{color:C.volt,fontSize:7,fontWeight:"900"},doneTextOn:{color:C.bg},mediaRow:{flexDirection:"row",gap:6,marginBottom:9},media:{flex:1,aspectRatio:1.1,borderRadius:10,backgroundColor:C.panel2},mediaEmpty:{flex:1,aspectRatio:1.1,borderRadius:10,backgroundColor:C.panel2,alignItems:"center",justifyContent:"center"},mediaEmptyText:{color:C.dim,fontSize:7,fontWeight:"900"},technique:{height:38,borderRadius:10,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center",marginBottom:12},techniqueText:{color:C.volt,fontSize:8,fontWeight:"900",letterSpacing:1},rest:{color:C.dim,fontSize:8,fontWeight:"900",letterSpacing:1.2,marginTop:10},finish:{height:58,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:8},finishPanel:{borderRadius:radius.lg,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,padding:16,marginTop:8},finishQuestion:{color:C.ink,fontSize:18,fontWeight:"900"},finishHint:{color:C.dim,fontSize:8,fontWeight:"900",letterSpacing:1.1,marginTop:3},rpeChoices:{flexDirection:"row",flexWrap:"wrap",gap:6,marginTop:14},rpeChoice:{width:34,height:34,borderRadius:10,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},rpeChoiceOn:{backgroundColor:C.volt,borderColor:C.volt},rpeChoiceText:{color:C.ink,fontSize:9,fontWeight:"900"},rpeChoiceTextOn:{color:C.bg},finishNote:{minHeight:76,borderRadius:12,borderWidth:1,borderColor:C.line,backgroundColor:C.panel2,color:C.ink,padding:10,textAlignVertical:"top",marginTop:12},finishActions:{flexDirection:"row",gap:8,marginTop:10},cancelFinish:{flex:1,height:48,borderRadius:radius.md,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},cancelFinishText:{color:C.ink,fontSize:8,fontWeight:"900"},finishConfirm:{flex:2,height:48,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center"},finishText:{color:C.bg,fontSize:10,fontWeight:"900",letterSpacing:1.4},achievement:{position:"absolute",zIndex:30,top:70,left:24,right:24,minHeight:54,borderRadius:18,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",paddingHorizontal:14},achievementText:{color:C.bg,fontSize:10,fontWeight:"900",letterSpacing:1.2,textAlign:"center"},modalSafe:{flex:1,backgroundColor:C.bg},modalHead:{height:62,paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:C.line},modalTitle:{color:C.ink,fontSize:15,fontWeight:"900"},modalClose:{color:C.volt,fontSize:8,fontWeight:"900"},modalContent:{padding:16,paddingBottom:60,gap:12},modalImages:{flexDirection:"row",gap:6},modalImage:{flex:1,aspectRatio:.78,borderRadius:12,backgroundColor:C.panel2},modalVideo:{width:"100%",aspectRatio:9/16,maxHeight:560,borderRadius:16,backgroundColor:C.panel2},modalHint:{color:C.dim,fontSize:11,lineHeight:18},restTimer:{position:"absolute",zIndex:20,top:72,alignSelf:"center",flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:16,height:48,borderRadius:24,backgroundColor:"#111711",borderWidth:1,borderColor:"#D7FF0055"},restLabel:{color:C.dim,fontSize:8,fontWeight:"900"},restValue:{color:C.ink,fontSize:20,fontWeight:"900"},skip:{color:C.volt,fontSize:8,fontWeight:"900"}
});
