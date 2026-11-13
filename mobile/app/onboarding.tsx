
import {Copy,LocalizedTextInput} from "../components/Locale";


import {useEffect,useRef,useState} from "react";
import {ActivityIndicator,Pressable,SafeAreaView,ScrollView,StyleSheet,Switch,Text,View} from "react-native";
import {BrandInput as TextInput} from "../components/BrandInput";
import {router} from "expo-router";
import Brand from "../components/Brand";
import {api,ApiError} from "../lib/api";
import {C,radius} from "../theme";

const goals=["Muskelaufbau","Fettabbau","Athletik","Fußball","Calisthenics","Gesundheit"];
import {parseDecimal} from "../lib/field-data";
const journeyAllowed=process.env.EXPO_PUBLIC_JOURNEY_ONBOARDING_ENABLED!=="false";
const levels=[
  {code:"READY",label:"READY",description:"Du startest gerade oder steigst wieder ein. Du baust Grundlagen auf und findest Schritt für Schritt in eine Trainingsroutine."},
  {code:"AWAKE",label:"AWAKE",description:"Du hast erste Trainingserfahrung, kennst grundlegende Übungen und möchtest regelmäßig und strukturiert trainieren."},
  {code:"DIFFERENT",label:"DIFFERENT",description:"Du trainierst regelmäßig und beherrschst die Grundlagen. Du arbeitest gezielt an deinen Zielen."},
  {code:"BE_DIFFERENT",label:"BE DIFFERENT",description:"Du trainierst fortgeschritten und strukturiert und suchst anspruchsvollere Inhalte für deine Leistung."},
  {code:"TRULY_DIFFERENT",label:"TRULY DIFFERENT",description:"Du hast umfangreiche Trainingserfahrung und möchtest Herausforderungen meistern und deine Leistung verfeinern."}
] as const;
const experienceOptions=[
  {value:"STARTER",label:"EINSTIEG"},
  {value:"REGULAR",label:"REGELMÄSSIG"},
  {value:"ADVANCED",label:"FORTGESCHRITTEN"}
] as const;
const sexOptions=[["male","MÄNNLICH"],["female","WEIBLICH"],["diverse","DIVERS"],["prefer_not_to_say","KEINE ANGABE"]] as const;

function birthToIso(value:string){
  const m=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());
  if(!m)return value.trim();
  return `${m[3]}-${m[2]}-${m[1]}`;
}
function ageFromBirth(value:string){
 const iso=birthToIso(value);
 const d=new Date(iso+"T00:00:00Z");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==iso)return null;
 const now=new Date();let age=now.getUTCFullYear()-d.getUTCFullYear();const m=now.getUTCMonth()-d.getUTCMonth();if(m<0||(m===0&&now.getUTCDate()<d.getUTCDate()))age--;return age;
}

export default function Onboarding(){
  const [step,setStep]=useState(1);
  const [journeyEnabled,setJourneyEnabled]=useState<boolean|null>(journeyAllowed?null:false);
  const pending=useRef(false);
  useEffect(()=>{
    if(!journeyAllowed)return;
    let active=true;
    api<{journeyOnboardingEnabled?:boolean}>("/api/auth/me")
      .then(result=>{if(active)setJourneyEnabled(result.journeyOnboardingEnabled??true)})
      .catch(()=>{if(active)setJourneyEnabled(true)});
    return()=>{active=false};
  },[]);
  const [goal,setGoal]=useState("Athletik");
  const [selectedGoals,setSelectedGoals]=useState<string[]>(["Athletik"]);
  const [selfLevel,setSelfLevel]=useState<(typeof levels)[number]["code"]|null>(null);
  const [womenDashboard,setWomenDashboard]=useState(false);
  const [journeyStatus,setJourneyStatus]=useState<"PENDING_PATHWAY"|"PENDING_PLACEMENT"|null>(null);
  const healthStep=journeyEnabled?4:3;
  const testStep=journeyEnabled?5:4;
  const finalStep=journeyEnabled?6:5;
  const [birth,setBirth]=useState("");
  const [sex,setSex]=useState("prefer_not_to_say");
  const [height,setHeight]=useState("");
  const [weight,setWeight]=useState("");
  const [experience,setExperience]=useState<"STARTER"|"REGULAR"|"ADVANCED">("STARTER");
  const [availability,setAvailability]=useState(3);
  const [health,setHealth]=useState(false);
  const [pushups,setPushups]=useState("");
  const [plank,setPlank]=useState("");
  const [run5k,setRun5k]=useState("");
  const [score,setScore]=useState<any>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function completeSetup(){
    if(pending.current)return;
    const reps=parseDecimal(pushups), seconds=parseDecimal(plank), running=parseDecimal(run5k);
    if(!Number.isInteger(reps)||reps<0||reps>500||!Number.isInteger(seconds)||seconds<0||seconds>3600){
      setError("Prüfe die Wiederholungen (0–500) und die Dauer (0–3600 Sekunden).");return;
    }
    if(run5k.trim()&&(!Number.isFinite(running)||running<10||running>180)){
      setError("Gib für den 5-km-Lauf 10 bis 180 Minuten ein oder lass das Feld frei.");return;
    }
    pending.current=true;setBusy(true);setError("");
    const base={
      goal:journeyEnabled?selectedGoals[0]:goal,birthDate:birthToIso(birth),sex,heightCm:parseDecimal(height),
      weightKg:parseDecimal(weight),trainingExperience:experience,availabilityPerWeek:availability,
      healthConsent:health,privacyConsent:true,termsConsent:true,pushups:reps,plankSeconds:seconds,
      ...(run5k.trim()&&{run5kMinutes:running})
    };
    const intake=journeyEnabled?{goals:selectedGoals,selfLevel,dashboard:womenDashboard&&sex==="female"?"WOMEN":"GENERAL"}:{};
    try{
      const result=await api<{score?:any;journey?:{status:"PENDING_PATHWAY"|"PENDING_PLACEMENT"}}>(
        "/api/onboarding/complete",{method:"POST",body:JSON.stringify({...base,...intake})});
      setJourneyStatus(result.journey?.status??null);
      setScore(result.score??null);setStep(finalStep);
      if(!result.score)void api("/api/score").then(value=>setScore(value.score)).catch(()=>undefined);
    }catch(e){
      if(e instanceof ApiError&&e.code==="JOURNEY_NOT_ENABLED"){
        setJourneyEnabled(false);setGoal(selectedGoals[0]??goal);setStep(3);
        setError("Dein Einstieg ist weiterhin möglich. Prüfe kurz deine Freigaben.");
      }else setError(e instanceof Error?e.message:"Einrichtung fehlgeschlagen.");
    }finally{pending.current=false;setBusy(false)}
  }

  function next(){
    setError("");
    if(journeyEnabled&&step===1&&selectedGoals.length===0){setError("Bitte mindestens ein Ziel auswählen.");return}
    if(step===2){
      const age=ageFromBirth(birth);
      if(age==null||age>120){setError("Bitte gib ein gültiges Geburtsdatum ein.");return}
      if(age<16){setError("BE DIFFERENT ist ab 16 Jahren verfügbar.");return}
      const h=parseDecimal(height),w=parseDecimal(weight);
      if(!Number.isFinite(h)||h<100||h>250||!Number.isFinite(w)||w<25||w>400){
        setError("Prüfe deine Größe (100–250 cm) und dein Gewicht (25–400 kg).");return;
      }
    }
    if(journeyEnabled&&step===3&&!selfLevel){setError("Bitte dein Einstiegslevel wählen.");return}
    if(step===testStep){completeSetup();return}
    if(step===finalStep){router.replace("/(tabs)");return}
    setError("");setStep(step+1);
  }

  if(journeyEnabled===null)return <SafeAreaView style={s.safe}><ActivityIndicator color={C.volt}/></SafeAreaView>;
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <Brand/>
    <View style={s.progress}>{Array.from({length:finalStep},(_,i)=>i+1).map(x=><View key={x} style={[s.bar,x<=step&&s.barOn]}/>)}</View>

    {step===1&&<><Text style={s.kicker}><Copy text={"01 · ZIEL"}/></Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68} style={s.title}><Copy text={"WAS WILLST"}/>{"\n"}<Copy text={"DU ERREICHEN?"}/></Text><Text style={s.copy}><Copy text={journeyEnabled?"Wähle mehrere Ziele. Dein Coach erstellt daraus einen zusammenhängenden Weg.":"Wähle deinen Trainingsfokus."}/></Text>
      <View style={s.goals}>{goals.map(g=>{const selected=journeyEnabled?selectedGoals.includes(g):goal===g;return <Pressable accessibilityRole="button" accessibilityState={{selected}} key={g} onPress={()=>journeyEnabled?setSelectedGoals(old=>old.includes(g)?old.filter(x=>x!==g):[...old,g]):setGoal(g)} style={[s.goal,selected&&s.goalOn]}><Text style={[s.goalText,selected&&s.goalTextOn]}>{g}</Text><Text style={[s.arrow,selected&&s.goalTextOn]}>{selected?"✓":"+"}</Text></Pressable>})}</View>
      {journeyEnabled&&<Text style={s.pathNote}>DEIN WEG: {selectedGoals.join(" + ")||"Bitte Ziele auswählen"}{"\n"}Dein Coach ordnet dir einen passenden Trainingsweg zu.</Text>}{step===1&&error?<Text style={s.error}>{error}</Text>:null}</>}

    {step===2&&<><Text style={s.kicker}><Copy text={"02 · AUSGANGSLAGE"}/></Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68} style={s.title}><Copy text={"DEINE"}/>{"\n"}<Copy text={"BASIS."}/></Text>
      <TextInput style={s.input} value={birth} onChangeText={setBirth} placeholder="TT.MM.JJJJ" placeholderTextColor={C.dim}/>
      <Text style={s.label}><Copy text={"GESCHLECHT FÜR REFERENZWERTE"}/></Text><View style={s.choiceRow}>{sexOptions.map(([value,label])=><Pressable key={value} style={[s.choice,sex===value&&s.choiceOn]} onPress={()=>{setSex(value);if(value!=="female")setWomenDashboard(false)}}><Text style={[s.choiceText,sex===value&&s.choiceTextOn]}><Copy text={label}/></Text></Pressable>)}</View>
      <LocalizedTextInput style={s.input} value={height} onChangeText={setHeight} keyboardType="number-pad" placeholder="Größe cm" placeholderTextColor={C.dim}/>
      <LocalizedTextInput style={s.input} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="Gewicht kg" placeholderTextColor={C.dim}/>
      {journeyEnabled&&sex==="female"&&<Pressable onPress={()=>setWomenDashboard(!womenDashboard)} style={[s.dashboardChoice,womenDashboard&&s.dashboardChoiceOn]}><Text style={s.dashboardTitle}><Copy text="FRAUEN-DASHBOARD OPTIONAL"/></Text><Text style={s.dashboardDescription}><Copy text="Als Startansicht anbieten. Alle Sportarten bleiben verfügbar. Später wechselbar."/></Text><Text style={s.dashboardTitle}>{womenDashboard?"✓ AUSGEWÄHLT":"+ ALLGEMEINE ANSICHT"}</Text></Pressable>}
      {!journeyEnabled&&<><Text style={s.label}><Copy text={"TRAININGSERFAHRUNG"}/></Text>
      <View style={s.choiceRow}>{experienceOptions.map(x=><Pressable key={x.value} style={[s.choice,experience===x.value&&s.choiceOn]} onPress={()=>setExperience(x.value)}><Text style={[s.choiceText,experience===x.value&&s.choiceTextOn]}><Copy text={x.label}/></Text></Pressable>)}</View></>}
      <Text style={s.label}><Copy text={"TRAININGSTAGE PRO WOCHE ·"}/>{availability}</Text>
      <View style={s.choiceRow}>{[2,3,4,5,6].map(x=><Pressable key={x} style={[s.choice,availability===x&&s.choiceOn]} onPress={()=>setAvailability(x)}><Text style={[s.choiceText,availability===x&&s.choiceTextOn]}>{x}</Text></Pressable>)}</View>
      <Text style={s.legal}><Copy text={"Trainings und Lifestyle Empfehlungen ersetzen keine medizinische Diagnose. Gesundheitsdaten werden nur nach deiner ausdrücklichen Einwilligung verarbeitet."}/></Text>
      {error?<Text style={s.error}><Copy text={error}/></Text>:null}
    </>}

    {journeyEnabled&&step===3&&<><Text style={s.kicker}><Copy text="03 · EINSTUFUNG"/></Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68} style={s.title}>WO STEHST{"\n"}DU HEUTE?</Text><Text style={s.copy}>Deine Selbsteinschätzung gilt für {selectedGoals.join(" + ")}. Sie schaltet keine Kapitel frei. Ein Test oder dein Coach bestätigt den Einstieg.</Text>
      <View style={s.levelCards}>{levels.map(level=><Pressable accessibilityRole="button" accessibilityState={{selected:selfLevel===level.code}} key={level.code} onPress={()=>setSelfLevel(level.code)} style={[s.levelCard,selfLevel===level.code&&s.levelCardOn]}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68} style={s.levelHeading}>{level.label} {selfLevel===level.code?"✓":""}</Text><Text style={s.levelDescription}>{level.description}</Text></Pressable>)}</View>
      <Text style={s.pathNote}><Copy text="Die konkreten Kriterien und Einstufungstests werden vom Coach festgelegt. Weder Score noch PRO bestätigen ein Level."/></Text>{step===3&&error?<Text style={s.error}>{error}</Text>:null}
    </>}

    {step===healthStep&&<><Text style={s.kicker}><Copy text={journeyEnabled?"04 · DATEN":"03 · DATEN"}/></Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68} style={s.title}><Copy text={"GESUNDHEIT"}/>{"\n"}<Copy text={"VERBINDEN."}/></Text><Text style={s.copy}><Copy text={"Du kannst Gesundheitsdaten später in ATHLET importieren. Die Freigabe ist freiwillig und lässt sich jederzeit widerrufen."}/></Text><View style={s.switch}><Text style={s.switchText}><Copy text={"GESUNDHEITSDATEN ERLAUBEN"}/></Text><Switch value={health} onValueChange={setHealth} trackColor={{true:C.volt}} thumbColor={health?C.bg:"#eee"}/></View>{error?<Text style={s.error}><Copy text={error}/></Text>:null}</>}

    {step===testStep&&<><Text style={s.kicker}><Copy text={journeyEnabled?"05 · STARTTEST":"04 · STARTTEST"}/></Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68} style={s.title}><Copy text={"DEIN ERSTER"}/>{"\n"}<Copy text={"MESSPUNKT."}/></Text><Text style={s.copy}><Copy text={"Führe zwei einfache Tests sauber aus. Der 5 km Lauf ist optional."}/></Text><LocalizedTextInput style={s.input} value={pushups} onChangeText={setPushups} keyboardType="number-pad" placeholder="Liegestütze Wiederholungen" placeholderTextColor={C.dim}/><LocalizedTextInput style={s.input} value={plank} onChangeText={setPlank} keyboardType="number-pad" placeholder="Unterarmstütz Sekunden" placeholderTextColor={C.dim}/><LocalizedTextInput style={s.input} value={run5k} onChangeText={setRun5k} keyboardType="decimal-pad" placeholder="5 km Lauf Minuten optional" placeholderTextColor={C.dim}/>{error?<Text style={s.error}><Copy text={error}/></Text>:null}</>}

    {step===finalStep&&<><Text style={s.kicker}><Copy text={journeyEnabled?"06 · DEIN ERGEBNIS":"05 · DEIN ERGEBNIS"}/></Text><Text style={s.result}>{score?.completeness>0?score.total:"—"}<Text style={s.resultPercent}>%</Text></Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68} style={s.resultTitle}>{journeyEnabled?"DEIN SCORE: AUSGANGSWERT":<><Copy text={"DU BIST"}/>{score?.level||"NORMAL"}.</>}</Text>
      {journeyEnabled&&<View style={s.dashboardChoice}><Text style={s.dashboardTitle}>SELBSTEINSCHÄTZUNG: {selfLevel?.replaceAll("_"," ")}</Text><Text style={s.dashboardDescription}>Status: {journeyStatus==="PENDING_PLACEMENT"?"EINSTUFUNG AUSSTEHEND":"TRAININGSWEG WIRD VORBEREITET"}. Noch kein Level freigeschaltet. PRO überspringt keine Prüfungen.</Text></View>}<Text style={s.copy}><Copy text={"Das ist dein erster messbarer Ausgangspunkt. Jetzt entwickeln wir ihn Schritt für Schritt weiter."}/></Text><View style={s.resultCard}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68} style={s.resultCardLabel}><Copy text={"DATENVOLLSTÄNDIGKEIT"}/></Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68} style={s.resultCardValue}>{score?.completeness??0}%</Text></View><Text style={s.trial}><Copy text={"Dein Profil ist bereit. Entdecke jetzt dein Dashboard und deine Trainingseinheiten."}/></Text></>}

    <Pressable style={[s.next,busy&&{opacity:.55}]} disabled={busy} onPress={next}><Text style={s.nextText}><Copy text={busy?"WIRD BERECHNET":step===testStep?"Starttest speichern":step===finalStep?"Zu START":"Weiter"}/></Text></Pressable>
    {step>1&&step<finalStep&&<Pressable onPress={()=>setStep(step-1)}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68} style={s.back}><Copy text={"Zurück"}/></Text></Pressable>}
  </ScrollView></SafeAreaView>;
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},content:{padding:22,paddingBottom:50},
  progress:{flexDirection:"row",gap:5,marginTop:28,marginBottom:48},bar:{height:3,flex:1,backgroundColor:"#242725"},barOn:{backgroundColor:C.volt},
  kicker:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:2},title:{color:C.ink,fontFamily:"Archivo",fontSize:36,lineHeight:40,letterSpacing:-.8,marginTop:12,marginBottom:30},
  goals:{gap:8},goal:{height:58,borderRadius:radius.md,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line,paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},goalOn:{backgroundColor:C.volt,borderColor:C.volt},
  goalText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:13,},goalTextOn:{color:C.bg},arrow:{color:C.volt,fontFamily:"Manrope",fontSize:18},
  input:{height:58,borderRadius:radius.md,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line,color:C.ink,paddingHorizontal:16,marginBottom:10,marginTop:8},
  copy:{color:C.dim,fontFamily:"Manrope",fontSize:14,lineHeight:22,marginBottom:24},switch:{height:64,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:radius.md,paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  switchText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1},next:{height:58,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:30},
  nextText:{color:C.bg,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1.3},back:{color:C.dim,textAlign:"center",fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1.2,marginTop:18},
  label:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1.3,marginTop:14},choiceRow:{flexDirection:"row",gap:6,flexWrap:"wrap",marginBottom:8},choice:{paddingVertical:10,paddingHorizontal:10,borderRadius:12,borderWidth:1,borderColor:C.line,backgroundColor:C.panel2},
  choiceOn:{backgroundColor:C.volt,borderColor:C.volt},choiceText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:11,},choiceTextOn:{color:C.bg},error:{color:C.red,fontFamily:"Manrope",fontSize:12,marginTop:10},legal:{color:C.dim,fontFamily:"Manrope",fontSize:11,lineHeight:15,marginTop:18},
  pathNote:{color:C.dim,fontFamily:"Manrope",fontSize:12,lineHeight:19,marginTop:17,marginBottom:15},
  levelCards:{gap:10},levelCard:{backgroundColor:C.panel2,borderWidth:1,borderColor:C.line,borderRadius:radius.md,padding:17},
  levelCardOn:{borderColor:C.volt,backgroundColor:"#24311f"},
  levelHeading:{color:C.volt,fontFamily:"Archivo",fontSize:19,marginBottom:9},
  levelDescription:{color:C.ink,fontFamily:"Manrope",fontSize:12,lineHeight:19},
  dashboardChoice:{padding:17,marginVertical:14,borderWidth:1,borderColor:C.line,borderRadius:radius.md,backgroundColor:C.panel2},
  dashboardChoiceOn:{borderColor:C.volt},
  dashboardTitle:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:12,marginBottom:8},
  dashboardDescription:{color:C.dim,fontFamily:"Manrope",fontSize:12,lineHeight:18,marginBottom:7},
  result:{color:C.ink,fontFamily:"Archivo",fontSize:104,letterSpacing:-.8,marginTop:14},resultPercent:{fontFamily:"Archivo",fontSize:38,color:C.volt},resultTitle:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:18,letterSpacing:1.4,marginBottom:18},resultCard:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",padding:16,borderRadius:radius.md,borderWidth:1,borderColor:C.line,backgroundColor:C.panel2},resultCardLabel:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,},resultCardValue:{color:C.ink,fontFamily:"Archivo",fontSize:24,},trial:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:12,lineHeight:19,marginTop:20,}
});
