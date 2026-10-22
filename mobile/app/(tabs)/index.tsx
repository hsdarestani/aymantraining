import {Copy,LocalizedValue,LanguagePicker} from "../../components/Locale";
import {useCallback,useMemo,useState} from "react";
import {ActivityIndicator,Image,Platform,Pressable,RefreshControl,ScrollView,StyleSheet,Text,View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {router,useFocusEffect} from "expo-router";
import {Card,Eyebrow,SectionTitle} from "../../components/Card";
import Brand from "../../components/Brand";
import {API,api} from "../../lib/api";
import {getSession} from "../../lib/session";
import {registerPush} from "../../lib/push";
import {syncHealth} from "../../lib/health";
import {C,radius} from "../../theme";
import {SafeAreaView,useSafeAreaInsets} from "react-native-safe-area-context";
import {syncHomeWidget} from "../../lib/widget-sync";
import ScoreRadar from "../../components/ScoreRadar";
import RhythmHorizon from "../../components/RhythmHorizon";

const pillarMeta=[
 ["S","strength","KRAFT"],["E","endurance","AUSDAUER"],["A","athleticism","ATHLETIK"],["M","mobility","BEWEGLICHKEIT"],
 ["R","recovery","REGENERATION"],["F","fuel","ERNÄHRUNG"],["C","consistency","KONSTANZ"]
] as const;

function Bar({value,max,accent=C.volt}:{value:number;max:number;accent?:string}){const pct=Math.max(0,Math.min(100,max?value/max*100:0));return <View style={s.metricTrack}><View style={[s.metricFill,{width:`${pct}%`,backgroundColor:accent}]}/></View>}

export default function Home(){
 const insets=useSafeAreaInsets();
 const bottomClearance=Platform.OS==="android"?Math.max(insets.bottom,32):Math.max(insets.bottom,12);
 const [d,setD]=useState<any>(null),[gamification,setGamification]=useState<any>(null),[refreshing,setRefreshing]=useState(false),[syncing,setSyncing]=useState(false);
 const [mediaToken,setMediaToken]=useState<string|null>(null);
 const [photoFailed,setPhotoFailed]=useState(false);
 const load=useCallback(async()=>{
  const [dash,game]=await Promise.all([
   api<any>("/api/mobile/dashboard"),
   api<any>("/api/gamification").catch(()=>null)
  ]);
  setPhotoFailed(false);setD(dash);setGamification(game);getSession().then(setMediaToken).catch(()=>{});syncHomeWidget(dash).catch(()=>{});registerPush().catch(()=>{});api("/api/subscription/sync",{method:"POST",body:"{}"}).catch(()=>{});
 },[]);
 useFocusEffect(useCallback(()=>{load().catch(()=>{})},[load]));
 async function refresh(){setRefreshing(true);await load().catch(()=>{});setRefreshing(false)}
 async function health(){setSyncing(true);await syncHealth().then(load).catch(()=>{});setSyncing(false)}
 const score=d?.score,a=d?.activity||{},pillars=d?.pillarPreview||d?.score||{};
 const profile=d?.dailyProfile,recordedValue=profile?.profile?.value??null,plan=profile?.plan;
 const line=String(d?.differentLine||"Heute zählt die nächste saubere Entscheidung.");
 const womenMode=d?.dashboardPreference?.enabled&&d?.dashboardPreference?.mode==="WOMEN";
 const womenGoals:Array<string>=Array.isArray(d?.womenGoals)?d.womenGoals:[];
 const goalLabel:Record<string,string>={muscle_building:"Muskelaufbau",fat_loss:"Fettabbau",athleticism:"Athletik",football:"Fußball",calisthenics:"Calisthenics",health:"Gesundheit"};
 const sleep=profile?.today?.sleepHours??null;
 const wearable=d?.wearable||{};
 const sleepDisplay=sleep==null?null:String(sleep);
 const priority=useMemo(()=>d?.recommendations?.[0]||null,[d]);
 const scorePillars=pillarMeta.map(([letter,key,label])=>({letter,key,label,value:typeof pillars?.[key]==="number"&&Number.isFinite(pillars[key])?Number(pillars[key]):null}));
 const nextFocus=[...scorePillars].filter(p=>p.value!=null).sort((a,b)=>(a.value??101)-(b.value??101))[0];
 if(!d)return <View style={s.center}><ActivityIndicator color={C.volt}/></View>;
 return <SafeAreaView edges={["top"]} style={s.safe}><ScrollView style={s.safe} contentContainerStyle={[s.content,{paddingBottom:126+bottomClearance}]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.volt}/>}>
  <View style={s.top}><Brand compact/><View style={s.topActions}><LanguagePicker inline/><Pressable onPress={()=>router.push("/digital-twin")} style={[s.scorePill,recordedValue!=null&&recordedValue<55&&s.scorePillAlert]}><Text style={s.scorePillLabel}><Copy text="BD SCORE"/></Text><Text style={s.scorePillValue}>{recordedValue==null?"?":recordedValue+"%"}</Text></Pressable></View></View>

  <View style={s.heroEditorial}>
   {d.heroPhotoId&&mediaToken&&!photoFailed?
    <Image source={{uri:API+"/api/media/"+d.heroPhotoId,headers:{Authorization:"Bearer "+mediaToken}}} resizeMode="cover" style={s.heroPhoto} onError={()=>setPhotoFailed(true)}/>:
    <View style={s.heroEmpty}>
     <View style={s.heroArt}><Text style={s.heroArtText}>B<Text style={s.heroArtVolt}>D</Text></Text><View style={s.heroArtLine}/><Text style={s.heroArtSub}>DIE NÄCHSTE VERSION DEINER SELBST.</Text></View>
     <Pressable accessibilityRole="button" onPress={()=>router.push("/progress-photos")} style={s.heroPhotoLink}>
      <Text style={s.heroPhotoLinkText}><Copy text="PERSÖNLICHES BILD HINZUFÜGEN ↗"/></Text>
     </Pressable>
    </View>} 
   <LinearGradient pointerEvents="none" colors={["#080A0B33","#080A0B5C","#080A0BF9"]} locations={[0,.48,1]} style={s.heroShade}/>
   <View style={s.heroCopy}>
    <Text style={s.eyebrow}><Copy text={womenMode?"DEINE PERSÖNLICHE TRAININGSANSICHT":"DEIN ATHLETEN DASHBOARD"}/></Text>
    <Text style={s.heroName}>{(d.user.name||"ATHLET").toUpperCase()}</Text>
    <Text style={s.morningLine}><Copy text={line}/></Text>
    <Pressable accessibilityRole="button" onPress={()=>router.push("/focus")}><Text style={s.focusLink}><Copy text="BE FOCUSED · 2 MIN ATMUNG →"/></Text></Pressable>
   </View>
   <View style={s.heroIndex}><Text style={s.heroIndexNumber}>01</Text><Text style={s.heroIndexLabel}><Copy text="ATHLETENMODUS"/></Text></View>
  </View>

    {womenMode&&<View style={s.womenPanel}>
     <Text style={s.womenEyebrow}><Copy text="DEINE ANSICHT · DEINE ENTSCHEIDUNG"/></Text>
     <Text style={s.womenHeading}><Copy text="STARK IN DEINEM TEMPO."/></Text>
     <Text style={s.womenCopy}><Copy text="Deine Ziele und deine echten Fortschritte. Alle Sportarten bleiben verfügbar."/></Text>
     <View style={s.womenCard}><Text style={s.womenEyebrow}><Copy text="TRAINING HEUTE"/></Text>
      <Text style={s.womenFact}>{plan?.scheduled?plan.completed+" von "+plan.scheduled+" Einheiten":"Kein Training eingetragen"}</Text>
      <Pressable accessibilityRole="button" onPress={()=>router.push("/(tabs)/training")}><Text style={s.womenAction}><Copy text="TRAINING ANSEHEN →"/></Text></Pressable>
     </View>
     <View style={s.womenCard}><Text style={s.womenEyebrow}><Copy text="DEIN BEFINDEN"/></Text>
      <Text style={s.womenFact}>Energie: {profile?.today?.energy??"Keine Angabe"}</Text>
      <Text style={s.womenCopy}>Schlaf: {profile?.today?.sleepHours==null?"Keine Angabe":profile.today.sleepHours+" h"}</Text>
      <Pressable accessibilityRole="button" onPress={()=>router.push("/lifestyle")}><Text style={s.womenAction}><Copy text="TAGESCHECK ÖFFNEN →"/></Text></Pressable>
     </View>
     {womenGoals.length>0&&<Text style={s.womenCopy}>DEINE ZIELE: {womenGoals.map(g=>goalLabel[g]||g).join(" · ")}</Text>}
     <Text style={s.womenCopy}>Bestätigte Stufe: {profile?.journey?.confirmedLevel?.replaceAll("_"," ")??"Noch keine Einstufung"}</Text>
     <Pressable accessibilityRole="button" onPress={()=>router.push("/settings")}><Text style={s.womenAction}><Copy text="ANSICHT ANPASSEN →"/></Text></Pressable>
    </View>}

    {priority?<Pressable onPress={()=>router.push("/lifestyle")} style={[s.priority,priority.severity==="critical"&&s.priorityCritical]}>
   <Text style={s.priorityKicker}><Copy text="HEUTE WICHTIG"/></Text><Text style={s.priorityTitle}><Copy text={priority.title}/></Text><Text style={s.priorityCopy}><Copy text={priority.action}/></Text>
  </Pressable>:null}

  {profile&&<View style={s.dailyProof}>
   <Text style={s.dailyProofEyebrow}>HEUTE · {profile.date}</Text>
   <Text style={s.dailyProofTitle}>{plan?.status==="NOT_SCHEDULED"?"Kein Training eingetragen":plan?.status==="DONE"?"Alle Einheiten erledigt":plan?.status==="PARTIAL"?"Training teilweise erledigt":"Training steht an"}</Text>
   <Text style={s.dailyProofText}>{plan?.scheduled?plan.completed+" von "+plan.scheduled+" geplanten Einheiten erledigt":"Das bedeutet nicht automatisch einen Erholungstag."}</Text>
   <Text style={s.dailyProofText}>ENERGIE: {profile.today.energy??"Keine Angabe"} · SCHLAF: {profile.today.sleepHours==null?"Keine Angabe":profile.today.sleepHours+" h"}</Text>
   <Text style={s.dailyProofText}>BESTÄTIGTE STUFE: {profile.journey.confirmedLevel??"Noch nicht bestätigt"}</Text>
   <Pressable accessibilityRole="button" onPress={()=>router.push("/(tabs)/training")}><Text style={s.dailyProofLink}>TRAININGSPLAN ANSEHEN →</Text></Pressable>
  </View>}
  <View style={s.editorialScore}>
   <View style={s.editorialIntro}>
    <Text style={s.editorialEyebrow}><Copy text="BE DIFFERENT SCORE"/></Text>
    <View style={s.editorialFigure}><Text style={s.editorialValue}>{recordedValue??"—"}</Text><Text style={s.editorialPercent}>%</Text></View>
    <Text style={s.editorialLevel}>LEISTUNGSPROFIL · KEINE STUFE</Text>
    <Text style={s.editorialTarget}>MESSSTAND: {profile?.profile.recordedDate??"Keine Angabe"}</Text>
    <Text style={s.editorialData}>DATENABDECKUNG {profile?.profile.completeness??0}%</Text>
   </View>
   <View style={s.radarPanel}>
    <ScoreRadar pillars={scorePillars}/>
    <View style={s.radarFocus}><Text style={s.radarFocusTag}><Copy text="NÄCHSTER FOKUS"/></Text><Text style={s.radarFocusName}><Copy text={nextFocus?.label||"NOCH KEINE DATEN"}/></Text><Text style={s.radarFocusValue}>{nextFocus?.value==null?"Keine Angabe":Math.round(nextFocus.value)+"%"}</Text></View>
   </View>
   <View style={s.pillarRows}>
    {scorePillars.map(p=><Pressable key={p.key} accessibilityRole="button" onPress={()=>router.push("/digital-twin")} style={s.pillarRow}>
     <Text style={[s.pillarRowLetter,p.value!=null&&p.value<60&&s.pillarRowAlert]}>{p.letter}</Text>
     <Text style={s.pillarRowName}><Copy text={p.label}/></Text>
     <Text style={s.pillarRowValue}>{p.value==null?"—":Math.round(p.value)}</Text>
    </Pressable>)}
   </View>
   <Pressable accessibilityRole="button" onPress={()=>router.push("/digital-twin")} style={s.editorialOpen}><Text style={s.editorialOpenText}><Copy text="ATHLETE DIGITAL TWIN ÖFFNEN →"/></Text></Pressable>
  </View>

    <RhythmHorizon days={d.dayStrip||[]}/>

  {process.env.EXPO_PUBLIC_JOURNEY_OVERVIEW_ENABLED!=="false"&&<Pressable accessibilityRole="button" onPress={()=>router.push("/journey")} style={s.priority}><Text style={s.priorityKicker}>DEIN TRAININGSWEG</Text><Text style={s.priorityTitle}>LEVEL & KAPITEL →</Text><Text style={s.priorityCopy}>Entdecke deinen bestätigten Fortschritt und den nächsten Schritt.</Text></Pressable>}
    {process.env.EXPO_PUBLIC_JOURNEY_DAILY_ENABLED!=="false"&&<Pressable accessibilityRole="button" onPress={()=>router.push("/journey-today")} style={s.priority}><Text style={s.priorityKicker}>HEUTE MIT DEINEM TRAINER</Text><Text style={s.priorityTitle}>DEIN TRAINING & DEINE ERHOLUNG →</Text><Text style={s.priorityCopy}>Deine geplante Einheit und persönliches Technikfeedback.</Text></Pressable>}
    {process.env.EXPO_PUBLIC_JOURNEY_TESTS_ENABLED==="true"&&<Pressable accessibilityRole="button" onPress={()=>router.push("/journey-tests")} style={s.priority}>
   <Text style={s.priorityKicker}>DEIN TRAININGSWEG</Text>
   <Text style={s.priorityTitle}>KAPITEL & AUFSTIEGSTESTS →</Text>
   <Text style={s.priorityCopy}>Sehe deine Freischaltungen, reiche Tests ein und lies Trainerfeedback.</Text>
  </Pressable>}

  <View style={s.performanceStream}>
   <Pressable accessibilityRole="button" style={[s.streamRow,s.streamLead]} onPress={()=>router.push("/lifestyle")}>
    <Text style={s.streamInitial}>R</Text><View style={s.streamContent}><Text style={s.streamTag}><Copy text="BE RESTED"/></Text><Text style={s.streamValue}>{sleepDisplay==null?<Copy text="Keine Angabe"/>:sleepDisplay+" h"}</Text><Text style={s.streamNote}><Copy text="Schlaf und Erholung"/></Text></View><Text style={s.streamArrow}>→</Text>
   </Pressable>
   <Pressable accessibilityRole="button" style={s.streamRow} onPress={()=>router.push("/fuel")}>
    <Text style={s.streamInitial}>F</Text><View style={s.streamContent}><Text style={s.streamTag}><Copy text="BE FUEL"/></Text><Text style={s.streamValue}>{a.proteinG==null?"Keine Angabe":Math.round(a.proteinG)+" g"}</Text><Text style={s.streamNote}><Copy text="Protein heute"/></Text></View><Text style={s.streamArrow}>→</Text>
   </Pressable>
   <Pressable accessibilityRole="button" style={s.streamRow} onPress={()=>router.push("/focus")}>
    <Text style={[s.streamInitial,s.streamAccent]}>M</Text><View style={s.streamContent}><Text style={s.streamTag}><Copy text="BE FOCUSED"/></Text><Text style={s.streamValue}>02:00</Text><Text style={s.streamNote}><Copy text="Atmung und Tagescheck"/></Text></View><Text style={s.streamArrow}>→</Text>
   </Pressable>
   <Pressable accessibilityRole="button" style={s.streamRow} onPress={()=>router.push("/community")}>
    <Text style={s.streamInitial}>C</Text><View style={s.streamContent}><Text style={s.streamTag}><Copy text="HERAUSFORDERUNGEN"/></Text><Text style={s.streamValue}>{gamification?.streak??0} <Copy text="Tage"/></Text><Text style={s.streamNote}><Copy text="Serie und Rangliste"/></Text></View><Text style={s.streamArrow}>→</Text>
   </Pressable>
   <Pressable accessibilityRole="button" style={s.quickLine} onPress={()=>router.push("/awake")}><Text style={s.quickLabel}><Copy text="BE AWAKE"/></Text><Text style={s.quickText}><Copy text="Morgenroutine · Tagesstart"/></Text><Text style={s.quickArrow}>→</Text></Pressable>
  </View>

    {d.cycleJournalEnabled?<Pressable accessibilityRole="button" onPress={()=>router.push("/cycle")} style={s.cycle}><Text style={s.cycleTag}>PRIVATER ZYKLUSKALENDER</Text><Text style={s.cycleTitle}>{d.cycle?"TAG "+d.cycle.day+" · NUR SCHÄTZUNG":"DEINE AUFZEICHNUNGEN"}</Text><Text style={s.cycleCopy}>Du entscheidest, welche Daten gespeichert und geteilt werden.</Text></Pressable>:null}

  <Pressable onPress={()=>router.push(d.nextWorkout?`/workout/${d.nextWorkout.id}`:"/(tabs)/training")}><View style={s.workout}><Text style={s.workoutKicker}><Copy text="HEUTIGES TRAINING"/></Text><Text style={s.workoutTitle}>{d.nextWorkout?.title?<>{d.nextWorkout.title}</>:<Copy text="KEIN TRAINING EINGETRAGEN"/>}</Text><Text style={s.cardCopy}>{d.nextWorkout?.scheduledAt?<LocalizedValue value={new Date(d.nextWorkout.scheduledAt)}/>:<Copy text="Noch kein Erholungstag bestätigt."/>}</Text><Text style={s.arrow}><Copy text={d.nextWorkout?"STARTEN →":"TRAINING ÖFFNEN →"}/></Text></View></Pressable>

  <Card><Eyebrow><Copy text="HEUTE"/></Eyebrow><SectionTitle><Copy text="Aktivität und Versorgung"/></SectionTitle>
   <View style={s.metric}><View style={s.metricHead}><Text style={s.metricName}><Copy text="SCHRITTE"/></Text><Text style={s.metricValue}>{a.steps==null?<Copy text="Keine Angabe"/>:<LocalizedValue value={Number(a.steps)} format="toLocaleString"/>} / <LocalizedValue value={Number(a.stepTarget||10000)} format="toLocaleString"/></Text></View><Bar value={a.steps||0} max={a.stepTarget||10000}/></View>
   <View style={s.metric}><View style={s.metricHead}><Text style={s.metricName}><Copy text="WASSER"/></Text><Text style={s.metricValue}>{a.waterMl??"Keine Angabe"} / {a.waterTargetMl||2500} ml</Text></View><Bar value={a.waterMl||0} max={a.waterTargetMl||2500}/></View>
   <View style={s.metric}><View style={s.metricHead}><Text style={s.metricName}><Copy text="PROTEIN"/></Text><Text style={s.metricValue}>{a.proteinG==null?"Keine Angabe":Math.round(a.proteinG)} / {a.proteinTargetG||130} g</Text></View><Bar value={a.proteinG||0} max={a.proteinTargetG||130}/></View>
  </Card>

  <Pressable style={({pressed})=>[s.sync,pressed&&{opacity:.75}]} onPress={health}><Text style={s.syncText}><Copy text={syncing?"GESUNDHEITSDATEN WERDEN SYNCHRONISIERT…":Platform.OS==="ios"?"APPLE HEALTH DATEN SYNCHRONISIEREN":"GADGET DATEN SYNCHRONISIEREN"}/></Text></Pressable>
  {Platform.OS==="ios"?<Pressable onPress={()=>router.push("/wearables")}><Text style={s.syncText}><Copy text="APPLE HEALTH VERBINDUNG UND DATENSCHUTZ →"/></Text></Pressable>:null}
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({
 womenPanel:{backgroundColor:"#18271F",borderWidth:1,borderColor:"#517860",borderTopWidth:3,borderTopColor:"#B4DFAC",padding:18,gap:13,marginVertical:12},womenEyebrow:{color:"#ABD4BA",fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:.9},womenHeading:{color:C.ink,fontFamily:"Archivo",fontSize:27,lineHeight:32},womenCopy:{color:"#D0DDD2",fontFamily:"Manrope",fontSize:12,lineHeight:19},womenCard:{backgroundColor:"#24392C",padding:13,gap:9,borderRadius:8},womenFact:{color:C.ink,fontFamily:"Archivo",fontSize:18},womenAction:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:11,marginTop:3},
 dailyProof:{backgroundColor:"#142019",padding:18,borderTopColor:C.volt,borderTopWidth:2,marginTop:6,gap:9},dailyProofEyebrow:{fontFamily:"ManropeSemiBold",fontSize:10,color:C.volt,letterSpacing:1},dailyProofTitle:{fontFamily:"Archivo",fontSize:21,color:C.ink},dailyProofText:{fontFamily:"Manrope",fontSize:12,color:C.ink,lineHeight:20},dailyProofLink:{color:C.volt,fontSize:11,fontFamily:"ManropeSemiBold",marginTop:6},

 heroEditorial:{height:335,backgroundColor:"#0B1011",overflow:"hidden",position:"relative",justifyContent:"flex-end",marginHorizontal:-16,marginTop:-3},
 heroPhoto:{position:"absolute",width:"100%",height:"100%",top:0,left:0},
 heroEmpty:{position:"absolute",top:0,right:0,bottom:0,left:0,backgroundColor:"#0E1615",overflow:"hidden"},
 heroArt:{position:"absolute",right:-7,top:27,alignItems:"flex-end",opacity:.55},
 heroArtText:{fontFamily:"Archivo",fontSize:167,letterSpacing:-12,color:"#31443B",lineHeight:180},
 heroArtVolt:{color:"#6A8B3D"},
 heroArtLine:{width:190,height:2,backgroundColor:"#778D51",marginTop:-20},
 heroArtSub:{fontFamily:"ManropeSemiBold",fontSize:7,color:"#B9D2A9",letterSpacing:1.2,marginTop:13,marginRight:18},
 heroPhotoLink:{position:"absolute",right:16,top:16,zIndex:10,paddingHorizontal:11,paddingVertical:9,borderWidth:1,borderColor:"#78924977",backgroundColor:"#14201ADD",borderRadius:4},
 heroPhotoLinkText:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:8,letterSpacing:.5},
 heroOrb:{position:"absolute",width:250,height:250,right:-70,top:5,borderRadius:125,borderWidth:1,borderColor:"#45615750",backgroundColor:"#19292636"},
 heroOrbInside:{position:"absolute",width:120,height:120,right:0,top:80,borderRadius:60,borderWidth:1,borderColor:"#8EBA8340"},
 heroShade:{position:"absolute",width:"100%",height:"100%",top:0,left:0},
 heroCopy:{paddingHorizontal:20,paddingBottom:57,position:"relative"},
 heroIndex:{position:"absolute",bottom:12,right:18,flexDirection:"row",alignItems:"center",gap:10},
 heroIndexNumber:{fontFamily:"Archivo",fontSize:12,color:C.red},
 heroIndexLabel:{fontFamily:"ManropeSemiBold",fontSize:9,color:C.ink,letterSpacing:1.5},
 editorialScore:{backgroundColor:"#0B0E0F",paddingHorizontal:18,paddingTop:34,paddingBottom:16,borderTopWidth:1,borderColor:"#1D2829"},
 editorialIntro:{alignItems:"flex-start"},
 editorialEyebrow:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1.7},
 editorialFigure:{flexDirection:"row",alignItems:"flex-start",marginTop:9},
 editorialValue:{color:C.ink,fontFamily:"Archivo",fontSize:73,lineHeight:84},
 editorialPercent:{color:C.red,fontFamily:"Archivo",fontSize:23,marginTop:16},
 editorialLevel:{alignSelf:"flex-start",borderWidth:1,borderColor:C.red,paddingHorizontal:9,paddingVertical:4,fontFamily:"ManropeSemiBold",fontSize:11,color:C.red,marginTop:1},
 editorialTarget:{fontFamily:"ManropeSemiBold",color:C.ink,fontSize:13,marginTop:15},
 editorialData:{fontFamily:"ManropeSemiBold",color:C.dim,fontSize:9,letterSpacing:1.1,marginTop:11},
 radarPanel:{alignItems:"center",paddingTop:12,borderBottomWidth:1,borderBottomColor:C.line,paddingBottom:21},
 radarFocus:{alignItems:"center",borderTopWidth:1,borderTopColor:C.red,paddingTop:9,minWidth:188,marginTop:-8},
 radarFocusTag:{fontFamily:"ManropeSemiBold",fontSize:9,color:C.red,letterSpacing:1.1},
 radarFocusName:{fontFamily:"Archivo",fontSize:17,color:C.ink,marginTop:7},
 radarFocusValue:{fontFamily:"ManropeSemiBold",fontSize:12,color:C.ink,marginTop:4},
 pillarRows:{flexDirection:"row",flexWrap:"wrap",marginTop:12},
 pillarRow:{width:"50%",flexDirection:"row",alignItems:"center",gap:7,borderBottomWidth:1,borderBottomColor:C.line,minHeight:49,paddingRight:10},
 pillarRowLetter:{fontFamily:"Archivo",fontSize:18,color:C.ink,minWidth:18},
 pillarRowAlert:{color:C.red},
 pillarRowName:{fontFamily:"ManropeSemiBold",fontSize:9,color:C.dim,flex:1},
 pillarRowValue:{fontFamily:"Archivo",fontSize:14,color:C.ink},
 editorialOpen:{paddingTop:19,paddingBottom:8},
 editorialOpenText:{fontFamily:"ManropeSemiBold",fontSize:11,color:C.volt,letterSpacing:.4},
 performanceStream:{backgroundColor:"#0A0E0F",borderTopWidth:1,borderTopColor:"#2E3837",marginTop:6},
 streamRow:{flexDirection:"row",alignItems:"center",paddingVertical:16,paddingHorizontal:17,borderBottomWidth:1,borderBottomColor:"#26302E",gap:13,minHeight:99},
 streamLead:{backgroundColor:"#111A18"},
 streamInitial:{fontFamily:"Archivo",fontSize:24,color:C.ink,minWidth:26},
 streamAccent:{color:C.red},
 streamContent:{flex:1,gap:4},
 streamTag:{fontFamily:"ManropeSemiBold",fontSize:10,color:C.dim,letterSpacing:1.4},
 streamValue:{fontFamily:"Archivo",fontSize:25,color:C.ink},
 streamNote:{fontFamily:"Manrope",fontSize:11,color:C.dim},
 streamArrow:{fontFamily:"Archivo",fontSize:21,color:C.volt},
 quickLine:{minHeight:60,flexDirection:"row",alignItems:"center",borderBottomWidth:1,borderBottomColor:C.line,paddingHorizontal:16,gap:10},
 quickLabel:{fontFamily:"Archivo",fontSize:14,color:C.ink},
 quickText:{fontFamily:"Manrope",fontSize:10,color:C.dim,flex:1},
 quickArrow:{fontFamily:"Archivo",fontSize:21,color:C.volt},

 safe:{flex:1,backgroundColor:C.bg},content:{padding:16,paddingBottom:108,gap:12},center:{flex:1,backgroundColor:C.bg,alignItems:"center",justifyContent:"center"},
 top:{height:58,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},topActions:{flexDirection:"row",alignItems:"center",gap:7},scorePill:{minWidth:92,borderRadius:20,borderWidth:1,borderColor:"#D4FF0050",paddingVertical:6,paddingHorizontal:10,alignItems:"flex-end"},scorePillAlert:{borderColor:"#FF566A88",backgroundColor:"#FF566A0D"},scorePillLabel:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:8,letterSpacing:1.2},scorePillValue:{color:C.ink,fontFamily:"Archivo",fontSize:18},
 heroTwin:{position:"absolute",top:0,right:-12,opacity:.62},hero:{minHeight:242,justifyContent:"flex-end",paddingVertical:22,paddingHorizontal:2,overflow:"hidden"},athleteGhost:{position:"absolute",right:16,top:9,width:112,height:220,opacity:.16,alignItems:"center"},ghostHead:{width:38,height:38,borderRadius:19,borderWidth:2,borderColor:C.ink},ghostTorso:{width:72,height:95,borderTopLeftRadius:30,borderTopRightRadius:30,borderWidth:2,borderColor:C.ink,marginTop:5},ghostLegs:{width:54,height:66,borderLeftWidth:2,borderRightWidth:2,borderColor:C.ink,marginTop:3},eyebrow:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:2.2},heroName:{color:C.ink,fontFamily:"Archivo",fontSize:48,lineHeight:49,letterSpacing:-1.4,marginTop:8,maxWidth:"78%"},morningLine:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:15,lineHeight:22,maxWidth:300,marginTop:16},focusLink:{color:C.red,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:1.15,marginTop:13},
 priority:{borderLeftWidth:3,borderLeftColor:C.red,paddingHorizontal:16,paddingVertical:13,backgroundColor:"#2A1115"},priorityCritical:{backgroundColor:"#3A1017"},priorityKicker:{color:C.red,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.8},priorityTitle:{color:C.ink,fontFamily:"Archivo",fontSize:20,marginTop:4},priorityCopy:{color:C.dim,fontFamily:"Manrope",fontSize:12,lineHeight:18,marginTop:5},
 scoreCard:{padding:18},scoreTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},scoreIdentity:{flex:1,gap:8},scoreCaption:{fontFamily:"Archivo",fontSize:19,color:C.ink,maxWidth:145,lineHeight:22},data:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.4},signature:{width:140,height:148,alignItems:"center",justifyContent:"center"},signatureSvg:{position:"absolute",top:0},signatureCenter:{position:"absolute",top:37,width:140,alignItems:"center"},signatureValue:{fontVariant:["tabular-nums"],color:C.ink,fontFamily:"Archivo",fontSize:42,letterSpacing:-1},signaturePercent:{fontFamily:"Manrope",fontSize:18},signatureLevel:{fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:.4},explosion:{position:"absolute",top:75,left:69,width:2,height:2},spark:{position:"absolute",width:3,height:14,borderRadius:2,backgroundColor:C.volt},truly:{position:"absolute",bottom:0,color:C.volt,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.6},
 pillars:{flexDirection:"row",justifyContent:"space-between",gap:4,borderTopWidth:1,borderTopColor:C.line,paddingTop:16,marginTop:4},pillar:{flex:1,alignItems:"center"},pillarRail:{width:8,height:62,backgroundColor:"#252A2D",borderRadius:4,justifyContent:"flex-end",overflow:"hidden"},pillarFill:{width:"100%",borderRadius:4},pillarLetter:{color:C.ink,fontFamily:"Archivo",fontSize:13,marginTop:5},pillarValue:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:8,marginTop:2},pillarLabel:{color:"#70777C",fontFamily:"ManropeSemiBold",fontSize:6,marginTop:2},scoreLink:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:1.1,marginTop:18},
 sectionHead:{paddingTop:8},sectionTitle:{color:C.ink,fontFamily:"Archivo",fontSize:25,letterSpacing:-.8,marginTop:4},days:{flexDirection:"row",gap:7},day:{flex:1,minHeight:135,padding:12,borderTopWidth:2,borderTopColor:C.line,backgroundColor:"#101416"},dayNow:{borderTopColor:C.red,backgroundColor:"#191215"},dayLabel:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:8,letterSpacing:1.3},dayLabelNow:{color:C.red},dayDate:{color:C.ink,fontFamily:"Archivo",fontSize:19,marginTop:7},dayWorkout:{color:C.dim,fontFamily:"Manrope",fontSize:10,lineHeight:14,marginTop:10},done:{color:C.green,fontFamily:"ManropeSemiBold",fontSize:8,letterSpacing:1,marginTop:8},
 loadSection:{backgroundColor:"#0C1010",borderRadius:22,borderWidth:1,borderColor:"#2B3332",padding:16,marginTop:8},
 loadHeading:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
 loadEyebrow:{color:"#A3ACA9",fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.6},
 loadMark:{color:C.red,fontFamily:"Archivo",fontSize:25},
 loadTitle:{color:C.ink,fontFamily:"Archivo",fontSize:25,lineHeight:28,letterSpacing:-.5,marginTop:8},
 loadSub:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1.1,marginTop:12,marginBottom:14},
 loadDays:{flexDirection:"row",gap:7},
 loadDay:{flex:1,minWidth:0,minHeight:153,borderRadius:14,backgroundColor:"#242827",padding:10,justifyContent:"flex-start",borderWidth:1,borderColor:"#282D2B"},
 loadToday:{backgroundColor:"#3A2420",borderColor:"#EB6652",borderWidth:1.5},
 loadLabel:{color:"#B0B4B2",fontFamily:"ManropeSemiBold",fontSize:9},
 loadLabelCurrent:{color:"#FF9787"},loadNumber:{fontFamily:"Archivo",fontSize:31,color:C.ink,marginTop:10},
 loadStatus:{color:"#ABB0AE",fontFamily:"ManropeSemiBold",fontSize:9,marginTop:5},
 loadWorkout:{color:C.dim,fontFamily:"Manrope",fontSize:9,lineHeight:13,marginTop:8},
 loadFooter:{color:"#8B9690",fontFamily:"Manrope",fontSize:9,marginTop:12},
 teaserRow:{flexDirection:"row",gap:8},teaser:{flex:1,minHeight:118,padding:14,backgroundColor:"#111517",borderTopWidth:1,borderTopColor:C.line},teaserRed:{borderTopColor:C.red},teaserTag:{color:C.red,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.35},teaserBig:{color:C.ink,fontFamily:"Archivo",fontSize:30,marginTop:12},teaserCopy:{color:C.dim,fontFamily:"Manrope",fontSize:10,marginTop:4},
 cycle:{padding:16,borderLeftWidth:3,borderLeftColor:C.red,backgroundColor:"#171113"},cycleTag:{color:C.red,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.4},cycleTitle:{color:C.ink,fontFamily:"Archivo",fontSize:21,marginTop:6},cycleCopy:{color:C.dim,fontFamily:"Manrope",fontSize:10,lineHeight:15,marginTop:5},
 workout:{minHeight:175,justifyContent:"flex-end",backgroundColor:"#101416",borderTopWidth:3,borderTopColor:C.volt,padding:20},workoutKicker:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.8},workoutTitle:{color:C.ink,fontFamily:"Archivo",fontSize:28,letterSpacing:-.8,marginTop:8},cardCopy:{color:C.dim,fontFamily:"Manrope",fontSize:12,lineHeight:18,marginTop:8},arrow:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:1.4,marginTop:16},
 metric:{marginTop:15},metricHead:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},metricName:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.1},metricValue:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:10},metricTrack:{height:5,backgroundColor:C.panel2,borderRadius:4,overflow:"hidden",marginTop:7},metricFill:{height:"100%"},
 exploreStrip:{flexDirection:"row",alignItems:"center",borderWidth:1,borderColor:"#46572E",borderRadius:19,backgroundColor:"#17201A",padding:15,gap:12},exploreCopy:{flex:1},exploreOverline:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.4},exploreTitle:{color:C.ink,fontFamily:"Archivo",fontSize:21,marginTop:6},exploreHint:{color:C.dim,fontFamily:"Manrope",fontSize:10,lineHeight:16,marginTop:5},exploreButton:{width:47,height:47,borderRadius:15,backgroundColor:C.volt,alignItems:"center",justifyContent:"center"},exploreButtonText:{fontFamily:"Archivo",color:C.bg,fontSize:26},
 awakeShortcut:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:13,paddingHorizontal:15,borderRadius:13,borderWidth:1,borderColor:"#514B2B",backgroundColor:"#201F16"},awakeOverline:{color:"#D4D2A2",fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:.8},awakeAction:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:9},
 sync:{height:50,borderRadius:radius.md,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},syncText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:1.35}
});
