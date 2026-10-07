import {Copy,LocalizedValue} from "../../components/Locale";
import {useCallback,useMemo,useState} from "react";
import {ActivityIndicator,Pressable,RefreshControl,ScrollView,StyleSheet,Text,View} from "react-native";
import Svg,{Circle} from "react-native-svg";
import Animated,{FadeInDown,ZoomIn} from "react-native-reanimated";
import {router,useFocusEffect} from "expo-router";
import {Card,Eyebrow,SectionTitle} from "../../components/Card";
import Brand from "../../components/Brand";
import {api} from "../../lib/api";
import {registerPush} from "../../lib/push";
import {syncHealth} from "../../lib/health";
import {C,radius} from "../../theme";
import {SafeAreaView} from "react-native-safe-area-context";
import {syncHomeWidget} from "../../lib/widget-sync";

const pillarMeta=[
 ["S","strength","KRAFT"],["E","endurance","AUSDAUER"],["A","athleticism","ATHLETIK"],["M","mobility","MOBILITY"],
 ["R","recovery","RECOVERY"],["F","fuel","FUEL"],["C","consistency","KONSTANZ"]
] as const;

function Bar({value,max,accent=C.volt}:{value:number;max:number;accent?:string}){const pct=Math.max(0,Math.min(100,max?value/max*100:0));return <View style={s.metricTrack}><View style={[s.metricFill,{width:`${pct}%`,backgroundColor:accent}]}/></View>}

function ScoreSignature({score,level}:{score:number;level:string}){
 const r=67,circ=2*Math.PI*r,pct=Math.max(0,Math.min(100,score)),complete=pct>=100;
 const stroke=pct<55?C.red:C.volt;
 return <View style={s.signature}>
  <Svg width={140} height={140} viewBox="0 0 170 170" style={s.signatureSvg}>
   <Circle cx="85" cy="85" r={r} stroke="#252928" strokeWidth="8" fill="none"/>
   <Circle cx="85" cy="85" r={r} stroke={stroke} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)} transform="rotate(-90 85 85)"/>
  </Svg>
  <View style={s.signatureCenter}><Text style={s.signatureValue}>{pct}<Text style={[s.signaturePercent,{color:stroke}]}>%</Text></Text><Text style={[s.signatureLevel,{color:stroke}]}>{level}</Text></View>
  {complete?<Animated.View entering={ZoomIn.duration(300)} style={s.explosion}>{Array.from({length:10},(_,i)=><View key={i} style={[s.spark,{transform:[{rotate:(i*36)+"deg"},{translateY:-88}]}]}/>)}</Animated.View>:null}
  {complete?<Animated.Text entering={FadeInDown.duration(450)} style={s.truly}>TRULY DIFFERENT</Animated.Text>:null}
 </View>
}

function Pillars({values}:{values:any}){
 return <View style={s.pillars}>{pillarMeta.map(([letter,key,label])=>{const value=values?.[key];const height=Math.max(8,Math.round((value??0)*.58));const accent=value!=null&&value<55?C.red:C.volt;return <Pressable key={key} onPress={()=>router.push("/digital-twin")} style={s.pillar}><View style={s.pillarRail}><View style={[s.pillarFill,{height,backgroundColor:value==null?C.line:accent}]}/></View><Text style={s.pillarLetter}>{letter}</Text><Text numberOfLines={1} style={s.pillarValue}>{value==null?"—":Math.round(value)}</Text><Text numberOfLines={1} style={s.pillarLabel}>{label}</Text></Pressable>})}</View>
}

export default function Home(){
 const [d,setD]=useState<any>(null),[gamification,setGamification]=useState<any>(null),[refreshing,setRefreshing]=useState(false),[syncing,setSyncing]=useState(false);
 const load=useCallback(async()=>{
  const [dash,game]=await Promise.all([
   api<any>("/api/mobile/dashboard"),
   api<any>("/api/gamification").catch(()=>null)
  ]);
  setD(dash);setGamification(game);syncHomeWidget(dash).catch(()=>{});registerPush().catch(()=>{});api("/api/subscription/sync",{method:"POST",body:"{}"}).catch(()=>{});
 },[]);
 useFocusEffect(useCallback(()=>{load().catch(()=>{})},[load]));
 async function refresh(){setRefreshing(true);await load().catch(()=>{});setRefreshing(false)}
 async function health(){setSyncing(true);await syncHealth().then(load).catch(()=>{});setSyncing(false)}
 const score=d?.score,a=d?.activity||{},pillars=d?.pillarPreview||d?.score||{};
 const dayLabels=["GESTERN","HEUTE","MORGEN"];
 const line=String(d?.differentLine||"Heute zählt die nächste saubere Entscheidung.");
 const sleep=a.sleepHours;
 const priority=useMemo(()=>d?.recommendations?.[0]||null,[d]);
 if(!d)return <View style={s.center}><ActivityIndicator color={C.volt}/></View>;
 return <SafeAreaView edges={["top"]} style={s.safe}><ScrollView style={s.safe} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.volt}/>}>
  <View style={s.top}><Brand compact/><Pressable onPress={()=>router.push("/digital-twin")} style={[s.scorePill,(score?.total??0)<55&&s.scorePillAlert]}><Text style={s.scorePillLabel}><Copy text="BD SCORE"/></Text><Text style={s.scorePillValue}>{score?.total??0}%</Text></Pressable></View>

  <View style={s.hero}>
   <View style={s.athleteGhost}><View style={s.ghostHead}/><View style={s.ghostTorso}/><View style={s.ghostLegs}/></View>
   <Text style={s.eyebrow}><Copy text={"GUTEN MORGEN"}/></Text>
   <Text style={s.heroName}>{(d.user.name||"ATHLET").toUpperCase()}</Text>
   <Text style={s.morningLine}>{line}</Text>
   <Pressable onPress={()=>router.push("/focus")}><Text style={s.focusLink}>BE FOCUSED · 2 MIN ATMUNG →</Text></Pressable>
  </View>

  {priority?<Pressable onPress={()=>router.push("/lifestyle")} style={[s.priority,priority.severity==="critical"&&s.priorityCritical]}>
   <Text style={s.priorityKicker}>HEUTE WICHTIG</Text><Text style={s.priorityTitle}>{priority.title}</Text><Text style={s.priorityCopy}>{priority.action}</Text>
  </Pressable>:null}

  <Card style={s.scoreCard}>
   <View style={s.scoreTop}><View style={s.scoreIdentity}><Eyebrow><Copy text="BE DIFFERENT SCORE"/></Eyebrow><Text style={s.scoreCaption}><Copy text="DEIN TAGESZIEL: 100%"/></Text><Text style={s.data}><Copy text={"DATEN"}/> {score?.completeness??0}%</Text></View><ScoreSignature score={score?.total??0} level={score?.level||"NORMAL"}/></View>
   <Pillars values={pillars}/>
   <Pressable onPress={()=>router.push("/digital-twin")}><Text style={s.scoreLink}><Copy text="ATHLETE DIGITAL TWIN ÖFFNEN →"/></Text></Pressable>
  </Card>

  <View style={s.sectionHead}><View><Eyebrow>DEINE 72 STUNDEN</Eyebrow><Text style={s.sectionTitle}>BELASTUNG IM BLICK.</Text></View></View>
  <View style={s.days}>{(d.dayStrip||[]).map((day:any,i:number)=>{const first=day.workouts?.[0];return <Pressable key={day.date} onPress={()=>router.push("/(tabs)/training")} style={[s.day,i===1&&s.dayNow]}>
   <Text style={[s.dayLabel,i===1&&s.dayLabelNow]}>{dayLabels[i]}</Text>
   <Text style={s.dayDate}>{String(day.date).slice(5).split("-").reverse().join(".")}</Text>
   <Text numberOfLines={2} style={s.dayWorkout}>{first?.title||(i===1?"REGENERATION / FREI":"NOCH NICHTS GEPLANT")}</Text>
   {first?.completed?<Text style={s.done}>ERLEDIGT</Text>:null}
  </Pressable>})}</View>

  <View style={s.teaserRow}>
   <Pressable style={s.teaser} onPress={()=>router.push("/lifestyle")}><Text style={s.teaserTag}>BE RESTED</Text><Text style={s.teaserBig}>{sleep==null?"—":sleep+" h"}</Text><Text style={s.teaserCopy}>Schlaf und Recovery</Text></Pressable>
   <Pressable style={s.teaser} onPress={()=>router.push("/fuel")}><Text style={s.teaserTag}><Copy text="BE FUEL"/></Text><Text style={s.teaserBig}>{Math.round(a.proteinG||0)} g</Text><Text style={s.teaserCopy}>Protein heute</Text></Pressable>
  </View>
  <View style={s.teaserRow}>
   <Pressable style={s.teaser} onPress={()=>router.push("/focus")}><Text style={s.teaserTag}>BE FOCUSED</Text><Text style={s.teaserBig}>02:00</Text><Text style={s.teaserCopy}>Atmung und Tagescheck</Text></Pressable>
   <Pressable style={[s.teaser,s.teaserRed]} onPress={()=>router.push("/community")}><Text style={s.teaserTag}>DIFFERENT STREAK</Text><Text style={s.teaserBig}>{gamification?.streak??0}</Text><Text style={s.teaserCopy}>Tage locked in</Text></Pressable>
  </View>

  {d.cycle?<Pressable onPress={()=>router.push("/context")} style={s.cycle}><Text style={s.cycleTag}>CYCLE CONTEXT</Text><Text style={s.cycleTitle}>TAG {d.cycle.day} · {d.cycle.phase}</Text><Text style={s.cycleCopy}>Training und Recovery berücksichtigen deinen freiwillig hinterlegten Zykluskontext.</Text></Pressable>:null}

  <Pressable onPress={()=>router.push(d.nextWorkout?`/workout/${d.nextWorkout.id}`:"/(tabs)/training")}><View style={s.workout}><Text style={s.workoutKicker}>HEUTIGES TRAINING</Text><Text style={s.workoutTitle}>{d.nextWorkout?.title||"REGENERATIONSTAG"}</Text><Text style={s.cardCopy}>{d.nextWorkout?.scheduledAt?<LocalizedValue value={new Date(d.nextWorkout.scheduledAt)}/>:<Copy text="Regeneration gehört zum Training."/>}</Text><Text style={s.arrow}>{d.nextWorkout?"STARTEN →":"TRAINING ÖFFNEN →"}</Text></View></Pressable>

  <Card><Eyebrow>HEUTE</Eyebrow><SectionTitle>Aktivität und Versorgung</SectionTitle>
   <View style={s.metric}><View style={s.metricHead}><Text style={s.metricName}>SCHRITTE</Text><Text style={s.metricValue}><LocalizedValue value={Number(a.steps||0)} format="toLocaleString"/> / <LocalizedValue value={Number(a.stepTarget||10000)} format="toLocaleString"/></Text></View><Bar value={a.steps||0} max={a.stepTarget||10000}/></View>
   <View style={s.metric}><View style={s.metricHead}><Text style={s.metricName}>WASSER</Text><Text style={s.metricValue}>{a.waterMl||0} / {a.waterTargetMl||2500} ml</Text></View><Bar value={a.waterMl||0} max={a.waterTargetMl||2500}/></View>
   <View style={s.metric}><View style={s.metricHead}><Text style={s.metricName}>PROTEIN</Text><Text style={s.metricValue}>{Math.round(a.proteinG||0)} / {a.proteinTargetG||130} g</Text></View><Bar value={a.proteinG||0} max={a.proteinTargetG||130}/></View>
  </Card>

  <Pressable style={({pressed})=>[s.sync,pressed&&{opacity:.75}]} onPress={health}><Text style={s.syncText}>{syncing?"GESUNDHEITSDATEN WERDEN SYNCHRONISIERT…":"GADGET DATEN SYNCHRONISIEREN"}</Text></Pressable>
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},content:{padding:16,paddingBottom:108,gap:12},center:{flex:1,backgroundColor:C.bg,alignItems:"center",justifyContent:"center"},
 top:{height:52,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},scorePill:{minWidth:92,borderRadius:20,borderWidth:1,borderColor:"#D4FF0050",paddingVertical:6,paddingHorizontal:10,alignItems:"flex-end"},scorePillAlert:{borderColor:"#FF566A88",backgroundColor:"#FF566A0D"},scorePillLabel:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:8,letterSpacing:1.2},scorePillValue:{color:C.ink,fontFamily:"Archivo",fontSize:18},
 hero:{minHeight:242,justifyContent:"flex-end",paddingVertical:22,paddingHorizontal:2,overflow:"hidden"},athleteGhost:{position:"absolute",right:16,top:9,width:112,height:220,opacity:.16,alignItems:"center"},ghostHead:{width:38,height:38,borderRadius:19,borderWidth:2,borderColor:C.ink},ghostTorso:{width:72,height:95,borderTopLeftRadius:30,borderTopRightRadius:30,borderWidth:2,borderColor:C.ink,marginTop:5},ghostLegs:{width:54,height:66,borderLeftWidth:2,borderRightWidth:2,borderColor:C.ink,marginTop:3},eyebrow:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:2.2},heroName:{color:C.ink,fontFamily:"Archivo",fontSize:48,lineHeight:49,letterSpacing:-1.4,marginTop:8,maxWidth:"78%"},morningLine:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:15,lineHeight:22,maxWidth:300,marginTop:16},focusLink:{color:C.red,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:1.15,marginTop:13},
 priority:{borderLeftWidth:3,borderLeftColor:C.red,paddingHorizontal:16,paddingVertical:13,backgroundColor:"#2A1115"},priorityCritical:{backgroundColor:"#3A1017"},priorityKicker:{color:C.red,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.8},priorityTitle:{color:C.ink,fontFamily:"Archivo",fontSize:20,marginTop:4},priorityCopy:{color:C.dim,fontFamily:"Manrope",fontSize:12,lineHeight:18,marginTop:5},
 scoreCard:{padding:18},scoreTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},scoreIdentity:{flex:1,gap:8},scoreCaption:{fontFamily:"Archivo",fontSize:19,color:C.ink,maxWidth:145,lineHeight:22},data:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.4},signature:{width:140,height:148,alignItems:"center",justifyContent:"center"},signatureSvg:{position:"absolute",top:0},signatureCenter:{position:"absolute",top:37,width:140,alignItems:"center"},signatureValue:{fontVariant:["tabular-nums"],color:C.ink,fontFamily:"Archivo",fontSize:42,letterSpacing:-1},signaturePercent:{fontFamily:"Manrope",fontSize:18},signatureLevel:{fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:.4},explosion:{position:"absolute",top:75,left:69,width:2,height:2},spark:{position:"absolute",width:3,height:14,borderRadius:2,backgroundColor:C.volt},truly:{position:"absolute",bottom:0,color:C.volt,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.6},
 pillars:{flexDirection:"row",justifyContent:"space-between",gap:4,borderTopWidth:1,borderTopColor:C.line,paddingTop:16,marginTop:4},pillar:{flex:1,alignItems:"center"},pillarRail:{width:8,height:62,backgroundColor:"#252A2D",borderRadius:4,justifyContent:"flex-end",overflow:"hidden"},pillarFill:{width:"100%",borderRadius:4},pillarLetter:{color:C.ink,fontFamily:"Archivo",fontSize:13,marginTop:5},pillarValue:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:8,marginTop:2},pillarLabel:{color:"#70777C",fontFamily:"ManropeSemiBold",fontSize:6,marginTop:2},scoreLink:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:1.1,marginTop:18},
 sectionHead:{paddingTop:8},sectionTitle:{color:C.ink,fontFamily:"Archivo",fontSize:25,letterSpacing:-.8,marginTop:4},days:{flexDirection:"row",gap:7},day:{flex:1,minHeight:135,padding:12,borderTopWidth:2,borderTopColor:C.line,backgroundColor:"#101416"},dayNow:{borderTopColor:C.red,backgroundColor:"#191215"},dayLabel:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:8,letterSpacing:1.3},dayLabelNow:{color:C.red},dayDate:{color:C.ink,fontFamily:"Archivo",fontSize:19,marginTop:7},dayWorkout:{color:C.dim,fontFamily:"Manrope",fontSize:10,lineHeight:14,marginTop:10},done:{color:C.green,fontFamily:"ManropeSemiBold",fontSize:8,letterSpacing:1,marginTop:8},
 teaserRow:{flexDirection:"row",gap:8},teaser:{flex:1,minHeight:118,padding:14,backgroundColor:"#111517",borderTopWidth:1,borderTopColor:C.line},teaserRed:{borderTopColor:C.red},teaserTag:{color:C.red,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.35},teaserBig:{color:C.ink,fontFamily:"Archivo",fontSize:30,marginTop:12},teaserCopy:{color:C.dim,fontFamily:"Manrope",fontSize:10,marginTop:4},
 cycle:{padding:16,borderLeftWidth:3,borderLeftColor:C.red,backgroundColor:"#171113"},cycleTag:{color:C.red,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.4},cycleTitle:{color:C.ink,fontFamily:"Archivo",fontSize:21,marginTop:6},cycleCopy:{color:C.dim,fontFamily:"Manrope",fontSize:10,lineHeight:15,marginTop:5},
 workout:{minHeight:175,justifyContent:"flex-end",backgroundColor:"#101416",borderTopWidth:3,borderTopColor:C.volt,padding:20},workoutKicker:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.8},workoutTitle:{color:C.ink,fontFamily:"Archivo",fontSize:28,letterSpacing:-.8,marginTop:8},cardCopy:{color:C.dim,fontFamily:"Manrope",fontSize:12,lineHeight:18,marginTop:8},arrow:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:1.4,marginTop:16},
 metric:{marginTop:15},metricHead:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},metricName:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.1},metricValue:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:10},metricTrack:{height:5,backgroundColor:C.panel2,borderRadius:4,overflow:"hidden",marginTop:7},metricFill:{height:"100%"},
 sync:{height:50,borderRadius:radius.md,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},syncText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:1.35}
});
