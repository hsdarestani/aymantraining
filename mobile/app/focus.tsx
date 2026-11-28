import {Copy,LocalizedTextInput} from "../components/Locale";
import {useLocale} from "../lib/i18n/locale";
import {useEffect,useRef,useState} from "react";
import {Animated,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";
import Svg,{Circle} from "react-native-svg";
import {useCoachVoice} from "../lib/coach-voice";
import {router} from "expo-router";
import Brand from "../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api} from "../lib/api";
import {C,radius} from "../theme";

const DURATION=120;
const CLOCK_CIRCUMFERENCE=2*Math.PI*101;
const clock=(seconds:number)=>Math.floor(seconds/60)+":"+String(seconds%60).padStart(2,"0");

export default function Focus(){
 const locale=useLocale();
 const voice=useCoachVoice("MOTIVATION");
 const voiceLabels=locale==="de"?{caption:"Trainerstimme",unavailable:"Audio momentan nicht verfügbar."}:{caption:"Coach voice",unavailable:"Audio unavailable."};
 const [d,setD]=useState<any>(null),[stress,setStress]=useState(5),[mood,setMood]=useState(7),[energy,setEnergy]=useState(7),[soreness,setSoreness]=useState(4),[sleepHours,setSleepHours]=useState("");
 const [seconds,setSeconds]=useState(DURATION),[running,setRunning]=useState(false),[status,setStatus]=useState("");
 const timer=useRef<ReturnType<typeof setInterval>|null>(null);
 const deadline=useRef(0),cueIndex=useRef(-1),breath=useRef(new Animated.Value(.88)).current;

 useEffect(()=>{api<any>("/api/focus").then(x=>{setD(x);setStress(x.check?.stress??5);setMood(x.check?.mood??7);setEnergy(x.check?.energy??7);setSoreness(x.check?.soreness??4);setSleepHours(x.check?.sleepHours==null?"":String(x.check.sleepHours))}).catch(()=>{})},[]);
 useEffect(()=>()=>{if(timer.current)clearInterval(timer.current);voice.stop()},[]);
 useEffect(()=>{
  if(!running){breath.stopAnimation();breath.setValue(.88);return}
  const animation=Animated.loop(Animated.sequence([
   Animated.timing(breath,{toValue:1.08,duration:4000,useNativeDriver:true}),
   Animated.timing(breath,{toValue:.88,duration:4000,useNativeDriver:true})
  ]));
  animation.start();
  return()=>animation.stop();
 },[breath,running]);

 useEffect(()=>{voice.stop()},[locale]);
 function clearTimer(){if(timer.current){clearInterval(timer.current);timer.current=null}}
 function breathe(){
  if(running){
   setSeconds(Math.max(0,Math.ceil((deadline.current-Date.now())/1000)));
   clearTimer();setRunning(false);voice.stop();
   return;
  }
  const duration=seconds===0?DURATION:seconds;
  if(seconds===0)setSeconds(DURATION);
  deadline.current=Date.now()+duration*1000;
  cueIndex.current=-1;
  setRunning(true);
  void voice.play();
  timer.current=setInterval(()=>{
   const remaining=Math.max(0,Math.ceil((deadline.current-Date.now())/1000));
   setSeconds(remaining);
   if(remaining===0){
    clearTimer();setRunning(false);voice.stop();return;
   }
   const step=Math.floor((DURATION-remaining)/16);
   if(step>cueIndex.current){
    cueIndex.current=step;
    
   }
  },250);
 }
 function reset(){clearTimer();setRunning(false);setSeconds(DURATION);cueIndex.current=-1;voice.stop()}
 function toggleVoice(){void voice.change(!voice.enabled)}
 async function save(){try{await api("/api/daily-check",{method:"POST",body:JSON.stringify({stress,mood,energy,soreness,sleepHours:Number(sleepHours)||undefined})});setStatus("GESPEICHERT")}catch(e:any){setStatus(e.message||"Fehler")}}
 const elapsed=DURATION-seconds,phase=Math.floor(elapsed/4)%2===0?"EINATMEN":"AUSATMEN";
 const progress=elapsed/DURATION;
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <View style={s.top}><Brand compact/><Pressable accessibilityRole="button" onPress={()=>router.back()}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={s.back}><Copy text="ZURÜCK"/></Text></Pressable></View>
  <View style={s.hero}><Text style={s.heroKicker}>BE FOCUSED / 001</Text><Text style={s.title}><Copy text="DEIN MOMENT."/>{"\n"}<Text style={s.accent}><Copy text="DEIN FOKUS."/></Text></Text><Text style={s.intro}><Copy text="120 Sekunden für dich. Ohne Leistungsdruck. Du bestimmst das Tempo."/></Text></View>
  <View style={s.breathCard}>
   <View style={s.breathHeader}><Text style={s.exerciseTag}><Copy text="ATEMTRAINING"/></Text><Text style={s.exerciseNumber}>01 / 02 MIN</Text></View>
   <View style={s.breathStage}>
    <Animated.View pointerEvents="none" style={[s.breathGlow,{transform:[{scale:breath}]}]}/>
    <Svg width={248} height={248} viewBox="0 0 248 248" style={s.progressSvg}>
     <Circle cx="124" cy="124" r="101" fill="#0F1417" stroke="#303C40" strokeWidth="5"/>
     <Circle cx="124" cy="124" r="101" fill="none" stroke={C.volt} strokeWidth="6" strokeLinecap="round" strokeDasharray={CLOCK_CIRCUMFERENCE} strokeDashoffset={CLOCK_CIRCUMFERENCE*(1-progress)} rotation={-90} originX="124" originY="124"/>
    </Svg>
    <View style={s.breathCenter}><Text style={s.timer}>{clock(seconds)}</Text><Text style={s.phase}><Copy text={seconds===0?"GESCHAFFT":running?phase:"BEREIT"}/></Text></View>
   </View>
   <Text style={s.prompt}><Copy text={seconds===0?"Gut gemacht. Atme normal weiter.":!running?"Starte, wenn du bereit bist.":phase==="EINATMEN"?"Atme ruhig durch die Nase ein.":"Atme entspannt wieder aus."}/></Text>
   <View style={s.controls}>
    <Pressable accessibilityRole="button" style={[s.primary,s.controlPrimary]} onPress={breathe}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={s.primaryText}><Copy text={running?"PAUSIEREN":seconds===0?"ERNEUT STARTEN":seconds===DURATION?"STARTEN":"FORTSETZEN"}/></Text></Pressable>
    <Pressable accessibilityRole="button" style={[s.secondary,s.controlSecondary]} onPress={reset}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={s.secondaryText}><Copy text="ZURÜCKSETZEN"/></Text></Pressable>
   </View>
   <Pressable accessibilityRole="switch" accessibilityState={{checked:voice.enabled}} onPress={toggleVoice} disabled={!voice.ready} style={s.voiceRow}><View style={[s.voiceIndicator,voice.enabled&&s.voiceOn]}/><View style={s.voiceCopy}><Text style={s.voiceTitle}><Copy text={voice.enabled?"SPRACHBEGLEITUNG AKTIV":"SPRACHBEGLEITUNG EINSCHALTEN"}/></Text><Text style={s.voiceCaption}>{voiceLabels.caption}</Text></View><Text style={s.voiceArrow}><Copy text={voice.enabled?"AN":"AUS"}/></Text></Pressable>
   {voice.error&&<Text style={s.safety}>{voiceLabels.unavailable}</Text>}
   <Text style={s.safety}><Copy text="Bei Unwohlsein stoppen. Normal weiteratmen. Kein Luftanhalten notwendig."/></Text>
  </View>
  <Card style={s.lineCard}><Eyebrow><Copy text="DEINE DIFFERENT LINE"/></Eyebrow><Text style={s.line}><Copy text={d?.line||"Heute zählt die nächste saubere Entscheidung."}/></Text></Card>
  <Card><Eyebrow><Copy text="TAGESCHECK"/></Eyebrow><SectionTitle><Copy text="Wie fühlst du dich?"/></SectionTitle><Scale label="ENERGIE" value={energy} set={setEnergy}/><Scale label="MUSKELKATER" value={soreness} set={setSoreness}/><Scale label="STIMMUNG" value={mood} set={setMood}/><Scale label="STRESS" value={stress} set={setStress}/><LocalizedTextInput style={s.sleepInput} value={sleepHours} onChangeText={setSleepHours} keyboardType="decimal-pad" placeholder="Schlafstunden optional" placeholderTextColor="#666"/><Pressable style={s.secondary} onPress={save}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={s.secondaryText}><Copy text="CHECK SPEICHERN"/></Text></Pressable></Card>
  {status?<Text style={s.status}><Copy text={status}/></Text>:null}
 </ScrollView></SafeAreaView>;
}
function Scale({label,value,set}:{label:string;value:number;set:(n:number)=>void}){return <View style={s.scale}><Text style={s.scaleLabel}><Copy text={label}/> · {value}</Text><View style={s.choices}>{[1,2,3,4,5,6,7,8,9,10].map(n=><Pressable key={n} onPress={()=>set(n)} style={[s.choice,n===value&&s.choiceOn]}><Text style={[s.choiceText,n===value&&s.choiceTextOn]}>{n}</Text></Pressable>)}</View></View>}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:100,gap:15},
 top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize: 13},
 hero:{paddingTop:14,paddingBottom:10},heroKicker:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize: 12,letterSpacing:2.7},title:{color:C.ink,fontFamily:"Archivo",fontSize:43,lineHeight:46,letterSpacing:-1.3,marginTop:13},accent:{color:C.volt},intro:{color:C.dim,fontFamily:"Manrope",fontSize:13,lineHeight:21,marginTop:15,maxWidth:320},
 breathCard:{borderWidth:1,borderColor:"#394B30",borderRadius:24,backgroundColor:"#11181A",padding:18,overflow:"hidden"},breathHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},exerciseTag:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize: 12,letterSpacing:1.6},exerciseNumber:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize: 12,letterSpacing:1.4},
 breathStage:{height:286,alignItems:"center",justifyContent:"center",position:"relative"},breathGlow:{position:"absolute",width:204,height:204,borderRadius:102,backgroundColor:"#42582A",opacity:.35},progressSvg:{position:"absolute"},breathCenter:{alignItems:"center",justifyContent:"center"},
 timer:{color:C.ink,fontFamily:"Archivo",fontSize:65,fontVariant:["tabular-nums"],letterSpacing:-2},phase:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:12,letterSpacing:2.1,marginTop:0},
 prompt:{color:C.dim,fontFamily:"Manrope",fontSize:13,textAlign:"center",minHeight:37,marginTop:1},controls:{flexDirection:"row",gap:9,marginTop:10},controlPrimary:{flex:1},controlSecondary:{flex:1},
 primary:{height:50,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center"},primaryText:{color:C.bg,fontFamily:"ManropeSemiBold",fontSize: 13},
 secondary:{height:50,borderRadius:radius.md,borderWidth:1,borderColor:"#405056",alignItems:"center",justifyContent:"center"},secondaryText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize: 13},
 voiceRow:{flexDirection:"row",alignItems:"center",gap:10,borderTopWidth:1,borderTopColor:"#29373A",marginTop:22,paddingTop:16},voiceIndicator:{width:11,height:11,borderRadius:6,backgroundColor:"#465056"},voiceOn:{backgroundColor:C.volt},voiceCopy:{flex:1},voiceTitle:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize: 12,letterSpacing:.4},voiceCaption:{color:C.dim,fontFamily:"Manrope",fontSize: 12,lineHeight:15,marginTop:4},voiceArrow:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize: 12},
 safety:{color:C.dim,fontFamily:"Manrope",fontSize: 12,lineHeight:16,marginTop:16,textAlign:"center"},lineCard:{paddingVertical:23},line:{color:C.ink,fontFamily:"Archivo",fontSize:24,lineHeight:31,marginTop:12},
 sleepInput:{height:48,borderRadius:radius.md,borderWidth:1,borderColor:C.line,backgroundColor:C.panel2,color:C.ink,paddingHorizontal:12,marginTop:14},scale:{marginTop:16},scaleLabel:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize: 13},choices:{flexDirection:"row",flexWrap:"wrap",gap:5,marginTop:7},choice:{width:30,height:30,borderRadius:9,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},choiceOn:{backgroundColor:C.volt,borderColor:C.volt},choiceText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize: 13},choiceTextOn:{color:C.bg},status:{color:C.green,textAlign:"center",fontFamily:"Manrope",fontSize: 13}
});
