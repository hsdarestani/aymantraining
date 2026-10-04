import {useEffect,useState} from "react";
import {ActivityIndicator,AppState,Image,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,TextInput,View,Vibration} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {ChevronLeft} from "lucide-react-native";
import {API,api} from "../../lib/api";
import {enqueue,flushOutbox} from "../../lib/offline";import {localMediaUri,preloadCurrentPlanMedia} from "../../lib/media-cache";
import Animated,{FadeIn,FadeInDown,FadeInUp,ZoomIn} from "react-native-reanimated";
import {C,radius} from "../../theme";

export default function Workout(){
 const {id}=useLocalSearchParams<{id:string}>();
 const [w,setW]=useState<any>(null);
 const [sets,setSets]=useState<Record<string,{weightKg?:string;reps?:string;rpe?:string;done?:boolean;queued?:boolean}>>({});
 const [finishing,setFinishing]=useState(false);
 const [rest,setRest]=useState(0);
 const [media,setMedia]=useState<Record<string,string>>({});

 useEffect(()=>{api<any>(`/api/workouts/${id}`).then(async x=>{setW(x.workout);const init:any={};for(const s of x.workout.sets)init[`${s.exerciseId}:${s.setNumber}`]={weightKg:String(s.weightKg??""),reps:String(s.reps??""),rpe:String(s.rpe??""),done:true};setSets(init);const urls=x.workout.exercises.flatMap((we:any)=>[we.exercise.imageStart,we.exercise.imageMiddle,we.exercise.imageEnd,we.exercise.videoUrl]).filter(Boolean);const pairs=await Promise.all(urls.map(async (u:string)=>[u,await localMediaUri(u)] as const));setMedia(Object.fromEntries(pairs));});api(`/api/workouts/${id}`,{method:"PATCH",body:JSON.stringify({action:"start"})}).catch(()=>{});flushOutbox();preloadCurrentPlanMedia().catch(()=>undefined);const sub=AppState.addEventListener("change",state=>{if(state==="active"){flushOutbox();preloadCurrentPlanMedia().catch(()=>undefined)}});return()=>sub.remove()},[id]);
 useEffect(()=>{if(rest<=0)return;const t=setInterval(()=>setRest(x=>Math.max(0,x-1)),1000);return()=>clearInterval(t)},[rest]);

 async function save(exId:string,n:number,restSeconds:number){
   const key=`${exId}:${n}`,x=sets[key]||{};
   const body={exerciseId:exId,setNumber:n,weightKg:Number(x.weightKg)||undefined,reps:Number(x.reps)||undefined,rpe:Number(x.rpe)||undefined};
   try{await api(`/api/workouts/${id}/sets`,{method:"POST",body:JSON.stringify(body)});setSets(current=>({...current,[key]:{...x,done:true,queued:false}}))}
   catch{await enqueue(`/api/workouts/${id}/sets`,body);setSets(current=>({...current,[key]:{...x,done:true,queued:true}}))}
   Vibration.vibrate(35);setRest(restSeconds);
 }

 async function finish(){
   setFinishing(true);const flushed=await flushOutbox();
   if(flushed.remaining){setFinishing(false);return}
   await api(`/api/workouts/${id}`,{method:"PATCH",body:JSON.stringify({action:"complete",rpe:8})}).then(()=>{Vibration.vibrate([80,50,130]);router.replace("/(tabs)")}).catch(()=>setFinishing(false));
 }

 if(!w)return <View style={s.center}><ActivityIndicator color={C.volt}/></View>;
 return <SafeAreaView style={s.safe}>
  <Animated.View entering={FadeInDown.duration(380)} style={s.top}><Pressable onPress={()=>router.back()}><ChevronLeft color={C.ink}/></Pressable><Text style={s.topText}>TRAININGSMODUS</Text><Text style={s.ready}>● AKTIV</Text></Animated.View>
  {rest>0&&<Animated.View entering={ZoomIn.duration(260)} style={s.restTimer}><Text style={s.restLabel}>PAUSE</Text><Text style={s.restValue}>{Math.floor(rest/60)}:{String(rest%60).padStart(2,"0")}</Text><Pressable onPress={()=>setRest(0)}><Text style={s.skip}>ÜBERSPRINGEN</Text></Pressable></Animated.View>}
  <ScrollView contentContainerStyle={s.content}>
   <Animated.Text entering={FadeInUp.delay(80).duration(460)} style={s.title}>{w.title}</Animated.Text><Animated.Text entering={FadeIn.delay(180).duration(420)} style={s.meta}>{w.exercises.length} ÜBUNGEN · JEDEN SATZ ERFASSEN</Animated.Text>
   {w.exercises.map((we:any,index:number)=><Animated.View entering={FadeInDown.delay(Math.min(index*70,420)).duration(480)} style={s.exercise} key={we.id}>
    <Text style={s.nr}>{String(index+1).padStart(2,"0")}</Text><Text style={s.name}>{we.exercise.nameDe}</Text><Text style={s.cue}>{we.exercise.coachCue1||"Kontrolliert und sauber ausführen."}</Text><View style={s.mediaRow}>{[we.exercise.imageStart,we.exercise.imageMiddle,we.exercise.imageEnd].map((u:any,i:number)=>u?<Image key={u} source={{uri:media[u]||(u.startsWith("http")?u:API+u)}} style={s.media}/>:<View key={i} style={s.mediaEmpty}><Text style={s.mediaEmptyText}>{["BEGINN","MITTE","ENDE"][i]}</Text></View>)}</View><Pressable style={s.technique} onPress={()=>router.push({pathname:"/exercise/[id]",params:{id:we.exerciseId}})}><Text style={s.techniqueText}>TECHNIK & VIDEO →</Text></Pressable>
    {Array.from({length:we.targetSets},(_,i)=>{const n=i+1,key=`${we.exerciseId}:${n}`,x=sets[key]||{};return <Animated.View entering={FadeInDown.delay(Math.min(220+i*45,520)).duration(360)} style={s.set} key={key}><Text style={s.setNr}>{n}</Text><TextInput style={s.input} value={x.weightKg||""} onChangeText={v=>setSets({...sets,[key]:{...x,weightKg:v}})} keyboardType="decimal-pad" placeholder="kg" placeholderTextColor="#555"/><TextInput style={s.input} value={x.reps||""} onChangeText={v=>setSets({...sets,[key]:{...x,reps:v}})} keyboardType="number-pad" placeholder="Wdh" placeholderTextColor="#555"/><TextInput style={s.rpe} value={x.rpe||""} onChangeText={v=>setSets({...sets,[key]:{...x,rpe:v}})} keyboardType="number-pad" placeholder="RPE" placeholderTextColor="#555"/><Pressable style={[s.done,x.done&&s.doneOn]} onPress={()=>save(we.exerciseId,n,we.restSeconds)}><Text style={[s.doneText,x.done&&s.doneTextOn]}>{x.queued?"W":x.done?"✓":"SPEICHERN"}</Text></Pressable></Animated.View>})}
    <Text style={s.rest}>PAUSE {we.restSeconds}s</Text>
   </Animated.View>)}
   <Animated.View entering={FadeInUp.delay(220).duration(480)}><Pressable style={s.finish} onPress={finish} disabled={finishing}><Text style={s.finishText}>{finishing?"WIRD SYNCHRONISIERT…":"TRAINING ABSCHLIESSEN →"}</Text></Pressable></Animated.View>
  </ScrollView>
 </SafeAreaView>
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},center:{flex:1,backgroundColor:C.bg,alignItems:"center",justifyContent:"center"},top:{height:62,paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:C.line},topText:{color:C.dim,fontSize:9,fontWeight:"900",letterSpacing:1.5},ready:{color:C.green,fontSize:8,fontWeight:"900"},content:{padding:16,paddingBottom:130},title:{color:C.ink,fontSize:43,lineHeight:40,fontWeight:"900",letterSpacing:-2.5,marginTop:10},meta:{color:C.dim,fontSize:9,fontWeight:"800",letterSpacing:1,marginTop:9,marginBottom:18},exercise:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:radius.lg,padding:18,marginBottom:12},nr:{color:"#343936",fontSize:30,fontWeight:"900"},name:{color:C.ink,fontSize:25,fontWeight:"900",letterSpacing:-1,marginTop:3},cue:{color:C.dim,fontSize:12,lineHeight:18,marginVertical:14},set:{flexDirection:"row",alignItems:"center",gap:6,marginBottom:7},setNr:{width:20,color:C.dim,fontSize:10,fontWeight:"900"},input:{flex:1,height:44,borderRadius:12,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line,color:C.ink,paddingHorizontal:7,textAlign:"center"},rpe:{width:50,height:44,borderRadius:12,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line,color:C.ink,paddingHorizontal:5,textAlign:"center"},done:{width:50,height:44,borderRadius:12,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},doneOn:{backgroundColor:C.volt,borderColor:C.volt},doneText:{color:C.volt,fontSize:7,fontWeight:"900"},doneTextOn:{color:C.bg},mediaRow:{flexDirection:"row",gap:6,marginBottom:9},media:{flex:1,aspectRatio:1.1,borderRadius:10,backgroundColor:C.panel2},mediaEmpty:{flex:1,aspectRatio:1.1,borderRadius:10,backgroundColor:C.panel2,alignItems:"center",justifyContent:"center"},mediaEmptyText:{color:C.dim,fontSize:7,fontWeight:"900"},technique:{height:38,borderRadius:10,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center",marginBottom:12},techniqueText:{color:C.volt,fontSize:8,fontWeight:"900",letterSpacing:1},rest:{color:C.dim,fontSize:8,fontWeight:"900",letterSpacing:1.2,marginTop:10},finish:{height:58,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:8},finishText:{color:C.bg,fontSize:10,fontWeight:"900",letterSpacing:1.4},restTimer:{position:"absolute",zIndex:20,top:72,alignSelf:"center",flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:16,height:48,borderRadius:24,backgroundColor:"#111711",borderWidth:1,borderColor:"#D7FF0055"},restLabel:{color:C.dim,fontSize:8,fontWeight:"900"},restValue:{color:C.ink,fontSize:20,fontWeight:"900"},skip:{color:C.volt,fontSize:8,fontWeight:"900"}
});
