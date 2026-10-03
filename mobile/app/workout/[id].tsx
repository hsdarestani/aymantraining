import {useEffect,useState} from "react";
import {ActivityIndicator,AppState,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,TextInput,View,Vibration} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {ChevronLeft} from "lucide-react-native";
import {api} from "../../lib/api";
import {enqueue,flushOutbox} from "../../lib/offline";
import {C,radius} from "../../theme";

export default function Workout(){
 const {id}=useLocalSearchParams<{id:string}>();
 const [w,setW]=useState<any>(null);
 const [sets,setSets]=useState<Record<string,{weightKg?:string;reps?:string;rpe?:string;done?:boolean;queued?:boolean}>>({});
 const [finishing,setFinishing]=useState(false);
 const [rest,setRest]=useState(0);

 useEffect(()=>{api<any>(`/api/workouts/${id}`).then(x=>{setW(x.workout);const init:any={};for(const s of x.workout.sets)init[`${s.exerciseId}:${s.setNumber}`]={weightKg:String(s.weightKg??""),reps:String(s.reps??""),rpe:String(s.rpe??""),done:true};setSets(init)});api(`/api/workouts/${id}`,{method:"PATCH",body:JSON.stringify({action:"start"})}).catch(()=>{});flushOutbox();const sub=AppState.addEventListener("change",state=>{if(state==="active")flushOutbox()});return()=>sub.remove()},[id]);
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
  <View style={s.top}><Pressable onPress={()=>router.back()}><ChevronLeft color={C.ink}/></Pressable><Text style={s.topText}>WORKOUT MODE</Text><Text style={s.ready}>● LIVE</Text></View>
  {rest>0&&<View style={s.restTimer}><Text style={s.restLabel}>REST</Text><Text style={s.restValue}>{Math.floor(rest/60)}:{String(rest%60).padStart(2,"0")}</Text><Pressable onPress={()=>setRest(0)}><Text style={s.skip}>SKIP</Text></Pressable></View>}
  <ScrollView contentContainerStyle={s.content}>
   <Text style={s.title}>{w.title}</Text><Text style={s.meta}>{w.exercises.length} EXERCISES · TRACK EVERY SET</Text>
   {w.exercises.map((we:any,index:number)=><View style={s.exercise} key={we.id}>
    <Text style={s.nr}>{String(index+1).padStart(2,"0")}</Text><Text style={s.name}>{we.exercise.nameDe}</Text><Text style={s.cue}>{we.exercise.coachCue1||"Kontrolliert und sauber ausführen."}</Text>
    {Array.from({length:we.targetSets},(_,i)=>{const n=i+1,key=`${we.exerciseId}:${n}`,x=sets[key]||{};return <View style={s.set} key={key}><Text style={s.setNr}>{n}</Text><TextInput style={s.input} value={x.weightKg||""} onChangeText={v=>setSets({...sets,[key]:{...x,weightKg:v}})} keyboardType="decimal-pad" placeholder="kg" placeholderTextColor="#555"/><TextInput style={s.input} value={x.reps||""} onChangeText={v=>setSets({...sets,[key]:{...x,reps:v}})} keyboardType="number-pad" placeholder="reps" placeholderTextColor="#555"/><TextInput style={s.rpe} value={x.rpe||""} onChangeText={v=>setSets({...sets,[key]:{...x,rpe:v}})} keyboardType="number-pad" placeholder="RPE" placeholderTextColor="#555"/><Pressable style={[s.done,x.done&&s.doneOn]} onPress={()=>save(we.exerciseId,n,we.restSeconds)}><Text style={[s.doneText,x.done&&s.doneTextOn]}>{x.queued?"Q":x.done?"✓":"SAVE"}</Text></Pressable></View>})}
    <Text style={s.rest}>REST {we.restSeconds}s</Text>
   </View>)}
   <Pressable style={s.finish} onPress={finish} disabled={finishing}><Text style={s.finishText}>{finishing?"SYNCING…":"FINISH WORKOUT →"}</Text></Pressable>
  </ScrollView>
 </SafeAreaView>
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},center:{flex:1,backgroundColor:C.bg,alignItems:"center",justifyContent:"center"},top:{height:62,paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:C.line},topText:{color:C.dim,fontSize:9,fontWeight:"900",letterSpacing:1.5},ready:{color:C.green,fontSize:8,fontWeight:"900"},content:{padding:16,paddingBottom:50},title:{color:C.ink,fontSize:43,lineHeight:40,fontWeight:"900",letterSpacing:-2.5,marginTop:10},meta:{color:C.dim,fontSize:9,fontWeight:"800",letterSpacing:1,marginTop:9,marginBottom:18},exercise:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:radius.lg,padding:18,marginBottom:12},nr:{color:"#343936",fontSize:30,fontWeight:"900"},name:{color:C.ink,fontSize:25,fontWeight:"900",letterSpacing:-1,marginTop:3},cue:{color:C.dim,fontSize:12,lineHeight:18,marginVertical:14},set:{flexDirection:"row",alignItems:"center",gap:6,marginBottom:7},setNr:{width:20,color:C.dim,fontSize:10,fontWeight:"900"},input:{flex:1,height:44,borderRadius:12,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line,color:C.ink,paddingHorizontal:7,textAlign:"center"},rpe:{width:50,height:44,borderRadius:12,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line,color:C.ink,paddingHorizontal:5,textAlign:"center"},done:{width:50,height:44,borderRadius:12,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},doneOn:{backgroundColor:C.volt,borderColor:C.volt},doneText:{color:C.volt,fontSize:7,fontWeight:"900"},doneTextOn:{color:C.bg},rest:{color:C.dim,fontSize:8,fontWeight:"900",letterSpacing:1.2,marginTop:10},finish:{height:58,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:8},finishText:{color:C.bg,fontSize:10,fontWeight:"900",letterSpacing:1.4},restTimer:{position:"absolute",zIndex:20,top:72,alignSelf:"center",flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:16,height:48,borderRadius:24,backgroundColor:"#111711",borderWidth:1,borderColor:"#D7FF0055"},restLabel:{color:C.dim,fontSize:8,fontWeight:"900"},restValue:{color:C.ink,fontSize:20,fontWeight:"900"},skip:{color:C.volt,fontSize:8,fontWeight:"900"}
});
