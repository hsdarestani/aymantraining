
import {LocalizedValue} from "../components/Locale";

import {Copy} from "../components/Locale";
import {useEffect,useMemo,useRef,useState} from "react";
import {Pressable,SafeAreaView,ScrollView,StyleSheet,Text,TextInput,View} from "react-native";
import {router} from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {useVideoPlayer,VideoView} from "expo-video";
import Brand from "../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api} from "../lib/api";
import {C,radius} from "../theme";

type Block={metric:string;label:string;unit:string;instructions?:string;instructionVideoUrl?:string};

function InstructionVideo({uri}:{uri:string}){
 const player=useVideoPlayer(uri,p=>{p.loop=true;p.muted=true});
 return <View style={s.videoWrap}><VideoView style={s.video} player={player} nativeControls contentFit="cover"/></View>;
}

export default function Tests(){
 const [items,setItems]=useState<any[]>([]);
 const [values,setValues]=useState<Record<string,string>>({});
 const [proofs,setProofs]=useState<Record<string,string>>({});
 const [status,setStatus]=useState("");
 const [index,setIndex]=useState(0);
 const [timer,setTimer]=useState(0);
 const [running,setRunning]=useState(false);
 const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);

 async function load(){const x:any=await api("/api/performance-tests");setItems(x.items||[])}
 useEffect(()=>{load().catch(()=>{})},[]);
 useEffect(()=>()=>{if(timerRef.current)clearInterval(timerRef.current)},[]);

 const due=items.find(x=>!x.completedAt);
 const blocks:Block[]=useMemo(()=>Array.isArray(due?.definition)&&due.definition.length?due.definition:[{metric:"pushups",label:"Liegestütze",unit:"Wdh"}],[due]);
 const block=blocks[index];

 function toggleTimer(){
  if(running){if(timerRef.current)clearInterval(timerRef.current);timerRef.current=null;setRunning(false);return}
  setRunning(true);
  timerRef.current=setInterval(()=>setTimer(x=>x+1),1000);
 }
 function resetTimer(){if(timerRef.current)clearInterval(timerRef.current);timerRef.current=null;setRunning(false);setTimer(0)}

 async function proof(){
  const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
  if(!permission.granted){setStatus("Bitte Mediathek Zugriff erlauben.");return}
  const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["videos"],quality:0.8,videoMaxDuration:120});
  if(result.canceled)return;
  const a=result.assets[0],form=new FormData();
  form.append("kind","TEST_VIDEO");
  form.append("file",{uri:a.uri,name:a.fileName||"testvideo.mp4",type:a.mimeType||"video/mp4"} as any);
  setStatus("VIDEO WIRD HOCHGELADEN");
  try{const up:any=await api("/api/media",{method:"POST",body:form});setProofs(x=>({...x,[block.metric]:"/api/media/"+up.asset.id}));setStatus("VIDEO GESPEICHERT")}
  catch(e:any){setStatus(e.message||"Video Upload fehlgeschlagen")}
 }

 async function finish(){
  if(!due)return;
  const results=blocks.map(b=>({metric:b.metric,value:Number(values[b.metric]),unit:b.unit,videoUrl:proofs[b.metric]}));
  if(results.some(x=>!Number.isFinite(x.value))){setStatus("Bitte alle Werte eintragen.");return}
  try{
   await api(`/api/performance-tests/${due.id}/complete`,{method:"POST",body:JSON.stringify({results})});
   setStatus("TEST GESPEICHERT");setValues({});setProofs({});setIndex(0);resetTimer();await load();
  }catch(e:any){setStatus(e.message||"Fehler")}
 }

 if(!due)return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}><View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}><Copy text={"ZURÜCK"}/></Text></Pressable></View><Eyebrow>BE DIFFERENT TEST</Eyebrow><Text style={s.title}><Copy text={"DEIN NÄCHSTER"}/>{"\n"}<Copy text={"TEST KOMMT."}/></Text><Card><SectionTitle><Copy text={"Kein Test fällig."}/></SectionTitle><Text style={s.note}><Copy text={"Der nächste Test wird von deinem Trainer geplant."}/></Text></Card><History items={items}/></ScrollView></SafeAreaView>;

 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}><Copy text={"ZURÜCK"}/></Text></Pressable></View>
  <Eyebrow>BE DIFFERENT TEST</Eyebrow><Text style={s.title}><Copy text={"TESTEN."}/>{"\n"}<Copy text={"VERGLEICHEN."}/>{"\n"}<Copy text={"ENTWICKELN."}/></Text>
  <Text style={s.progress}><Copy text={"BAUSTEIN"}/>{index+1}<Copy text={"VON"}/>{blocks.length}</Text>
  <Card>
   <Eyebrow><Copy text={"GEFÜHRTER TEST"}/></Eyebrow><SectionTitle><Copy text={block.label}/></SectionTitle>
   {block.instructions?<Text style={s.note}>{block.instructions}</Text>:<Text style={s.note}><Copy text={"Sauber ausführen und Ergebnis eintragen."}/></Text>}
   {block.instructionVideoUrl?<InstructionVideo uri={block.instructionVideoUrl}/>:null}
   <View style={s.timer}><Text style={s.timerValue}>{Math.floor(timer/60)}:{String(timer%60).padStart(2,"0")}</Text><View style={s.timerActions}><Pressable style={s.secondary} onPress={toggleTimer}><Text style={s.secondaryText}><Copy text={running?"STOPP":"TIMER STARTEN"}/></Text></Pressable><Pressable style={s.secondary} onPress={resetTimer}><Text style={s.secondaryText}><Copy text={"NULLSTELLEN"}/></Text></Pressable></View></View>
   <View style={s.value}><TextInput style={s.input} keyboardType="decimal-pad" value={values[block.metric]||""} onChangeText={v=>setValues({...values,[block.metric]:v})} placeholder="0" placeholderTextColor="#626864"/><Text style={s.unit}>{block.unit}</Text></View>
   <Pressable style={s.proof} onPress={proof}><Text style={s.proofText}><Copy text={proofs[block.metric]?"BELEGVIDEO GESPEICHERT":"OPTIONALES BELEGVIDEO"}/></Text></Pressable>
   <View style={s.nav}>{index>0?<Pressable style={s.secondary} onPress={()=>{setIndex(index-1);resetTimer()}}><Text style={s.secondaryText}><Copy text={"ZURÜCK"}/></Text></Pressable>:<View/>}{index<blocks.length-1?<Pressable style={s.primarySmall} onPress={()=>{if(!Number.isFinite(Number(values[block.metric]))||values[block.metric]===""){setStatus("Bitte zuerst den Wert eintragen.");return}setIndex(index+1);resetTimer();setStatus("")}}><Text style={s.primaryText}><Copy text={"WEITER →"}/></Text></Pressable>:<Pressable style={s.primarySmall} onPress={finish}><Text style={s.primaryText}><Copy text={"TEST ABSCHLIESSEN →"}/></Text></Pressable>}</View>
  </Card>
  <History items={items}/>
  {status?<Text style={s.status}><Copy text={status}/></Text>:null}
 </ScrollView></SafeAreaView>;
}

function History({items}:{items:any[]}){
 return <Card><Eyebrow><Copy text={"LEISTUNGSVERLAUF"}/></Eyebrow>{items.filter(x=>x.completedAt).slice(0,20).map((x:any,i:number)=>{
  const prev=items.filter(y=>y.completedAt).slice(0,20)[i+1];
  const current=x.results?.[0]?.value,old=prev?.results?.find((r:any)=>r.metric===x.results?.[0]?.metric)?.value;
  const diff=current!=null&&old!=null?current-old:null;
  return <View style={s.history} key={x.id}><View><Text style={s.label}>{x.name}</Text><Text style={s.note}><LocalizedValue value={new Date(x.completedAt)} format="toLocaleDateString"/></Text></View><View style={{alignItems:"flex-end"}}><Text style={s.histVal}>{current??"Keine Angabe"} {x.results?.[0]?.unit??""}</Text>{diff!=null?<Text style={diff>=0?s.up:s.down}>{diff>=0?"+":""}{Math.round(diff*10)/10}</Text>:null}</View></View>
 })}</Card>;
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:60,gap:12},top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontSize:9,fontWeight:"900"},title:{color:C.ink,fontSize:44,lineHeight:39,fontWeight:"900",letterSpacing:-3,marginVertical:12},progress:{color:C.volt,fontSize:9,fontWeight:"900",letterSpacing:1.5},
 note:{color:C.dim,fontSize:10,lineHeight:16,marginTop:6},videoWrap:{marginTop:12,borderRadius:radius.md,overflow:"hidden",backgroundColor:C.panel2},video:{width:"100%",aspectRatio:16/9},timer:{marginTop:14,padding:14,borderRadius:radius.md,backgroundColor:C.panel2},timerValue:{color:C.ink,fontSize:42,fontWeight:"900",fontVariant:["tabular-nums"]},timerActions:{flexDirection:"row",gap:8,marginTop:8},value:{flexDirection:"row",alignItems:"center",gap:8,marginTop:14},input:{flex:1,height:54,borderRadius:12,borderWidth:1,borderColor:C.line,backgroundColor:C.panel2,color:C.ink,textAlign:"center",fontSize:20},unit:{color:C.dim,fontSize:10,fontWeight:"900"},proof:{height:46,borderRadius:radius.md,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center",marginTop:10},proofText:{color:C.ink,fontSize:8,fontWeight:"900"},nav:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:8,marginTop:14},secondary:{minHeight:42,borderRadius:radius.md,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center",paddingHorizontal:14},secondaryText:{color:C.ink,fontSize:8,fontWeight:"900"},primarySmall:{minHeight:44,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",paddingHorizontal:14},primaryText:{color:C.bg,fontSize:8,fontWeight:"900"},history:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:11,borderBottomWidth:1,borderBottomColor:C.line},label:{color:C.ink,fontSize:11,fontWeight:"900"},histVal:{color:C.volt,fontWeight:"900"},up:{color:C.green,fontSize:8,fontWeight:"900"},down:{color:C.red,fontSize:8,fontWeight:"900"},status:{color:C.green,fontSize:11,textAlign:"center"}
});
