
import {LocalizedValue} from "../../components/Locale";

import {Copy} from "../../components/Locale";
import {useCallback,useState} from "react";
import {ActivityIndicator,Pressable,RefreshControl,ScrollView,StyleSheet,Text,View} from "react-native";
import Svg,{Circle} from "react-native-svg";
import Animated,{FadeIn,FadeInDown,ZoomIn} from "react-native-reanimated";
import {router,useFocusEffect} from "expo-router";
import {Card,Eyebrow,SectionTitle} from "../../components/Card";
import Brand from "../../components/Brand";
import {api} from "../../lib/api";
import {registerPush} from "../../lib/push";
import {syncHealth} from "../../lib/health";
import {C,radius} from "../../theme";
import {syncHomeWidget} from "../../lib/widget-sync";

function Bar({value,max}:{value:number;max:number}){const pct=Math.max(0,Math.min(100,max?value/max*100:0));return <View style={s.metricTrack}><View style={[s.metricFill,{width:`${pct}%`}]}/></View>}

function ScoreSignature({score,level}:{score:number;level:string}){
 const r=74,circ=2*Math.PI*r,pct=Math.max(0,Math.min(100,score)),complete=pct>=100;
 return <View style={s.signature}>
  <Svg width={188} height={188} viewBox="0 0 188 188" style={s.signatureSvg}>
   <Circle cx="94" cy="94" r={r} stroke="#252928" strokeWidth="9" fill="none"/>
   <Circle cx="94" cy="94" r={r} stroke={C.volt} strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)} transform="rotate(-90 94 94)"/>
  </Svg>
  <View style={s.signatureCenter}><Text style={s.signatureValue}>{pct}<Text style={s.signaturePercent}>%</Text></Text><Text style={s.signatureLevel}>{level}</Text></View>
  {complete?<Animated.View entering={ZoomIn.duration(300)} style={s.explosion}>{Array.from({length:12},(_,i)=><View key={i} style={[s.spark,{transform:[{rotate:(i*30)+"deg"},{translateY:-98}]}]}/>)}</Animated.View>:null}
  {complete?<Animated.Text entering={FadeInDown.duration(450)} style={s.truly}>TRULY DIFFERENT</Animated.Text>:null}
 </View>
}


export default function Home(){
 const [d,setD]=useState<any>(null),[refreshing,setRefreshing]=useState(false),[syncing,setSyncing]=useState(false);
 const load=useCallback(async()=>{const x:any=await api("/api/mobile/dashboard");setD(x);syncHomeWidget(x).catch(()=>{});registerPush().catch(()=>{});api("/api/subscription/sync",{method:"POST",body:"{}"}).catch(()=>{});},[]);
 useFocusEffect(useCallback(()=>{load().catch(()=>{})},[load]));
 async function refresh(){setRefreshing(true);await load().catch(()=>{});setRefreshing(false)}
 async function health(){setSyncing(true);await syncHealth().then(load).catch(()=>{});setSyncing(false)}
 if(!d)return <View style={s.center}><ActivityIndicator color={C.volt}/></View>;
 const score=d.score,a=d.activity||{};
 return <ScrollView style={s.safe} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.volt}/>}>
  <View style={s.top}><Brand compact/><Text style={s.plan}>{d.user.tier}</Text></View>
  <View style={s.hero}><Text style={s.eyebrow}><Copy text={"GUTEN MORGEN,"}/>{(d.user.name||"ATHLET").toUpperCase()}</Text><Text style={s.title}><Copy text={"BAUE DEINEN"}/>{"\n"}<Copy text={"ATHLETEN."}/></Text><Text style={s.copy}><Copy text={"Daten werden zu einer klaren Entscheidung für heute."}/></Text></View>
  <Card style={s.scoreCard}><Eyebrow><Copy text={"BE DIFFERENT LEISTUNGSWERT"}/></Eyebrow><ScoreSignature score={score?.total??0} level={score?.level||"NORMAL"}/><View style={s.track}><View style={[s.fill,{width:`${score?.total??0}%`}]}/></View><Text style={s.data}><Copy text={"DATEN"}/>{score?.completeness??0}<Copy text={"% VOLLSTÄNDIG"}/></Text></Card>

  <Card>
   <View style={s.cardHead}><View><Eyebrow><Copy text={"TRAINER RADAR"}/></Eyebrow><SectionTitle>{d.recommendations?.[0]?.title||"Daten sammeln."}</SectionTitle></View><Text style={s.live}><Copy text={d.radarLocked?"◆ PRO":"● AKTIV"}/></Text></View>
   <Text style={s.cardCopy}>{d.recommendations?.[0]?.action||"Verbinde Gesundheitsdaten oder mach deinen Tagescheck."}</Text>
   {d.radarLocked?<Pressable style={s.radarCta} onPress={()=>router.push("/membership")}><Text style={s.radarCtaText}><Copy text={"TRAINER RADAR FREISCHALTEN →"}/></Text></Pressable>:null}
  </Card>

  <Pressable onPress={()=>d.nextWorkout&&router.push(`/workout/${d.nextWorkout.id}`)}><Card style={s.workout}><Eyebrow><Copy text={"HEUTIGES TRAINING"}/></Eyebrow><Text style={s.workoutTitle}>{d.nextWorkout?.title||"REGENERATIONSTAG"}</Text><Text style={s.cardCopy}><Copy text={d.nextWorkout?.scheduledAt?new Date(d.nextWorkout.scheduledAt).toLocaleString("de-DE"):"Regeneration gehört zum Training."}/></Text><Text style={s.arrow}><Copy text={d.nextWorkout?"STARTEN →":"BEWUSST ERHOLEN."}/></Text></Card></Pressable>

  <Card><Eyebrow><Copy text={"HEUTE"}/></Eyebrow><SectionTitle><Copy text={"Aktivität und Versorgung"}/></SectionTitle>
   <View style={s.metric}><View style={s.metricHead}><Text style={s.metricName}><Copy text={"SCHRITTE"}/></Text><Text style={s.metricValue}><LocalizedValue value={Number(a.steps||0)} format="toLocaleString"/> / <LocalizedValue value={Number(a.stepTarget||10000)} format="toLocaleString"/></Text></View><Bar value={a.steps||0} max={a.stepTarget||10000}/></View>
   <View style={s.metric}><View style={s.metricHead}><Text style={s.metricName}><Copy text={"WASSER"}/></Text><Text style={s.metricValue}>{a.waterMl||0} / {a.waterTargetMl||2500} ml</Text></View><Bar value={a.waterMl||0} max={a.waterTargetMl||2500}/></View>
   <View style={s.metric}><View style={s.metricHead}><Text style={s.metricName}>PROTEIN</Text><Text style={s.metricValue}>{Math.round(a.proteinG||0)} / {a.proteinTargetG||130} g</Text></View><Bar value={a.proteinG||0} max={a.proteinTargetG||130}/></View>
   <Text style={s.calories}><Copy text={"AKTIVE KALORIEN"}/>{Math.round(a.activeCalories||0)}</Text>
  </Card>

  <Pressable style={({pressed})=>[s.sync,pressed&&{opacity:.75}]} onPress={health}><Text style={s.syncText}><Copy text={syncing?"GESUNDHEITSDATEN WERDEN SYNCHRONISIERT…":"GESUNDHEITSDATEN SYNCHRONISIEREN"}/></Text></Pressable>
 </ScrollView>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},content:{padding:16,paddingBottom:112,gap:12},center:{flex:1,backgroundColor:C.bg,alignItems:"center",justifyContent:"center"},top:{height:56,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},plan:{color:C.volt,fontSize:8,fontWeight:"900",letterSpacing:1.8,borderWidth:1,borderColor:"#D7FF0040",borderRadius:20,paddingVertical:7,paddingHorizontal:10},
 hero:{paddingVertical:20},eyebrow:{color:C.volt,fontSize:9,fontWeight:"900",letterSpacing:2.2},title:{color:C.ink,fontSize:58,lineHeight:49,fontWeight:"900",letterSpacing:-3.6,marginTop:12},copy:{color:C.dim,fontSize:13,lineHeight:20,maxWidth:310,marginTop:16},scoreCard:{alignItems:"center",paddingVertical:28},score:{color:C.ink,fontSize:88,fontWeight:"900",letterSpacing:-6,marginTop:8},percent:{fontSize:34,color:C.volt},level:{color:C.volt,fontSize:10,fontWeight:"900",letterSpacing:2},signature:{width:210,height:225,alignItems:"center",justifyContent:"center",marginTop:4},signatureSvg:{position:"absolute",top:7},signatureCenter:{position:"absolute",top:49,alignItems:"center"},signatureValue:{color:C.ink,fontSize:60,fontWeight:"900",letterSpacing:-5},signaturePercent:{fontSize:22,color:C.volt},signatureLevel:{color:C.volt,fontSize:9,fontWeight:"900",letterSpacing:1.8},explosion:{position:"absolute",top:101,left:104,width:2,height:2},spark:{position:"absolute",width:3,height:17,borderRadius:2,backgroundColor:C.volt},truly:{position:"absolute",bottom:2,color:C.volt,fontSize:10,fontWeight:"900",letterSpacing:2},track:{height:4,backgroundColor:"#252928",width:"100%",marginTop:22,overflow:"hidden"},fill:{height:"100%",backgroundColor:C.volt},data:{color:C.dim,fontSize:8,fontWeight:"800",letterSpacing:1.4,marginTop:9},
 cardHead:{flexDirection:"row",justifyContent:"space-between",gap:10},live:{color:C.green,fontSize:8,fontWeight:"900",letterSpacing:1.2},cardCopy:{color:C.dim,fontSize:13,lineHeight:20,marginTop:10},radarCta:{height:44,borderRadius:radius.md,borderWidth:1,borderColor:"#D7FF0055",alignItems:"center",justifyContent:"center",marginTop:14},radarCtaText:{color:C.volt,fontSize:8,fontWeight:"900",letterSpacing:1},
 workout:{minHeight:180,justifyContent:"flex-end",backgroundColor:"#10150C"},workoutTitle:{color:C.ink,fontSize:32,fontWeight:"900",letterSpacing:-1.5,marginTop:8},arrow:{color:C.volt,fontSize:10,fontWeight:"900",letterSpacing:1.5,marginTop:18},
 metric:{marginTop:15},metricHead:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},metricName:{color:C.dim,fontSize:8,fontWeight:"900",letterSpacing:1.1},metricValue:{color:C.ink,fontSize:9,fontWeight:"900"},metricTrack:{height:5,backgroundColor:C.panel2,borderRadius:4,overflow:"hidden",marginTop:7},metricFill:{height:"100%",backgroundColor:C.volt},calories:{color:C.dim,fontSize:8,fontWeight:"900",letterSpacing:1.1,marginTop:15},
 sync:{height:50,borderRadius:radius.md,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},syncText:{color:C.ink,fontSize:9,fontWeight:"900",letterSpacing:1.5}
});
