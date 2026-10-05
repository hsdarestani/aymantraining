
import {Copy,LocalizedTextInput} from "../components/Locale";


import {useState} from "react";
import {Pressable,SafeAreaView,ScrollView,StyleSheet,Switch,Text,View} from "react-native";
import {BrandInput as TextInput} from "../components/BrandInput";
import {router} from "expo-router";
import Brand from "../components/Brand";
import {api} from "../lib/api";
import {syncHealth} from "../lib/health";
import {C,radius} from "../theme";

const goals=["Muskelaufbau","Fettabbau","Athletik","Fußball","Calisthenics","Gesundheit"];
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
 const d=new Date(birthToIso(value));if(Number.isNaN(d.getTime()))return null;
 const now=new Date();let age=now.getFullYear()-d.getFullYear();const m=now.getMonth()-d.getMonth();if(m<0||(m===0&&now.getDate()<d.getDate()))age--;return age;
}

export default function Onboarding(){
  const [step,setStep]=useState(1);
  const [goal,setGoal]=useState("Athletik");
  const [birth,setBirth]=useState("01.01.2000");
  const [sex,setSex]=useState("prefer_not_to_say");
  const [height,setHeight]=useState("180");
  const [weight,setWeight]=useState("80");
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
    if(!Number(pushups)||!Number(plank)){setError("Bitte Liegestütze und Unterarmstütz eintragen.");return}
    const age=ageFromBirth(birth);
    if(age==null){setError("Bitte ein gültiges Geburtsdatum eintragen.");setStep(2);return}
    if(age<16){setError("BE DIFFERENT ist zum Start ab 16 Jahren verfügbar.");setStep(2);return}
    setBusy(true);setError("");
    try{
      await api("/api/onboarding/complete",{method:"POST",body:JSON.stringify({
        goal,birthDate:birthToIso(birth),sex,heightCm:Number(height),weightKg:Number(weight),
        trainingExperience:experience,availabilityPerWeek:availability,healthConsent:health,privacyConsent:true,termsConsent:true
      })});
      await api("/api/performance-tests",{method:"POST",body:JSON.stringify({
        name:"STARTTEST",
        results:[
          {metric:"pushups",value:Number(pushups),unit:"Wdh"},
          {metric:"plank",value:Number(plank),unit:"Sekunden"},
          ...(Number(run5k)>0?[{metric:"5k_time",value:Number(run5k),unit:"Minuten"}]:[])
        ]
      })});
      if(health)await syncHealth().catch(()=>undefined);
      const result:any=await api("/api/score");
      setScore(result.score);setStep(5);
    }catch(e:any){setError(e.message||"Einrichtung fehlgeschlagen.")}
    finally{setBusy(false)}
  }

  function next(){
    setError("");
    if(step===4){completeSetup();return}
    if(step===5){router.replace("/membership?onboarding=1");return}
    setStep(step+1);
  }

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
    <Brand/>
    <View style={s.progress}>{[1,2,3,4,5].map(x=><View key={x} style={[s.bar,x<=step&&s.barOn]}/>)}</View>

    {step===1&&<><Text style={s.kicker}><Copy text={"01 · ZIEL"}/></Text><Text style={s.title}><Copy text={"WAS WILLST"}/>{"\n"}<Copy text={"DU ERREICHEN?"}/></Text><View style={s.goals}>{goals.map(g=><Pressable key={g} onPress={()=>setGoal(g)} style={[s.goal,goal===g&&s.goalOn]}><Text style={[s.goalText,goal===g&&s.goalTextOn]}>{g}</Text><Text style={[s.arrow,goal===g&&s.goalTextOn]}>{goal===g?"✓":"→"}</Text></Pressable>)}</View></>}

    {step===2&&<><Text style={s.kicker}><Copy text={"02 · AUSGANGSLAGE"}/></Text><Text style={s.title}><Copy text={"DEINE"}/>{"\n"}<Copy text={"BASIS."}/></Text>
      <TextInput style={s.input} value={birth} onChangeText={setBirth} placeholder="TT.MM.JJJJ" placeholderTextColor={C.dim}/>
      <Text style={s.label}><Copy text={"GESCHLECHT FÜR REFERENZWERTE"}/></Text><View style={s.choiceRow}>{sexOptions.map(([value,label])=><Pressable key={value} style={[s.choice,sex===value&&s.choiceOn]} onPress={()=>setSex(value)}><Text style={[s.choiceText,sex===value&&s.choiceTextOn]}><Copy text={label}/></Text></Pressable>)}</View>
      <LocalizedTextInput style={s.input} value={height} onChangeText={setHeight} keyboardType="number-pad" placeholder="Größe cm" placeholderTextColor={C.dim}/>
      <LocalizedTextInput style={s.input} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="Gewicht kg" placeholderTextColor={C.dim}/>
      <Text style={s.label}><Copy text={"TRAININGSERFAHRUNG"}/></Text>
      <View style={s.choiceRow}>{experienceOptions.map(x=><Pressable key={x.value} style={[s.choice,experience===x.value&&s.choiceOn]} onPress={()=>setExperience(x.value)}><Text style={[s.choiceText,experience===x.value&&s.choiceTextOn]}><Copy text={x.label}/></Text></Pressable>)}</View>
      <Text style={s.label}><Copy text={"TRAININGSTAGE PRO WOCHE ·"}/>{availability}</Text>
      <View style={s.choiceRow}>{[2,3,4,5,6].map(x=><Pressable key={x} style={[s.choice,availability===x&&s.choiceOn]} onPress={()=>setAvailability(x)}><Text style={[s.choiceText,availability===x&&s.choiceTextOn]}>{x}</Text></Pressable>)}</View>
      <Text style={s.legal}><Copy text={"Trainings und Lifestyle Empfehlungen ersetzen keine medizinische Diagnose. Gesundheitsdaten werden nur nach deiner ausdrücklichen Einwilligung verarbeitet."}/></Text>
      {error?<Text style={s.error}><Copy text={error}/></Text>:null}
    </>}

    {step===3&&<><Text style={s.kicker}><Copy text={"03 · DATEN"}/></Text><Text style={s.title}><Copy text={"GESUNDHEIT"}/>{"\n"}<Copy text={"VERBINDEN."}/></Text><Text style={s.copy}><Copy text={"Schlaf, HRV, Ruhepuls, Schritte, Kalorien, VO2max und Gewicht werden nur nach deiner Einwilligung genutzt. Fehlende Werte bleiben sichtbar unvollständig."}/></Text><View style={s.switch}><Text style={s.switchText}><Copy text={"GESUNDHEITSDATEN ERLAUBEN"}/></Text><Switch value={health} onValueChange={setHealth} trackColor={{true:C.volt}} thumbColor={health?C.bg:"#eee"}/></View></>}

    {step===4&&<><Text style={s.kicker}><Copy text={"04 · STARTTEST"}/></Text><Text style={s.title}><Copy text={"DEIN ERSTER"}/>{"\n"}<Copy text={"MESSPUNKT."}/></Text><Text style={s.copy}><Copy text={"Führe zwei einfache Tests sauber aus. Der 5 km Lauf ist optional."}/></Text><LocalizedTextInput style={s.input} value={pushups} onChangeText={setPushups} keyboardType="number-pad" placeholder="Liegestütze Wiederholungen" placeholderTextColor={C.dim}/><LocalizedTextInput style={s.input} value={plank} onChangeText={setPlank} keyboardType="number-pad" placeholder="Unterarmstütz Sekunden" placeholderTextColor={C.dim}/><LocalizedTextInput style={s.input} value={run5k} onChangeText={setRun5k} keyboardType="decimal-pad" placeholder="5 km Lauf Minuten optional" placeholderTextColor={C.dim}/>{error?<Text style={s.error}><Copy text={error}/></Text>:null}</>}

    {step===5&&<><Text style={s.kicker}><Copy text={"05 · DEIN ERGEBNIS"}/></Text><Text style={s.result}>{score?.total??0}<Text style={s.resultPercent}>%</Text></Text><Text style={s.resultTitle}><Copy text={"DU BIST"}/>{score?.level||"NORMAL"}.</Text><Text style={s.copy}><Copy text={"Das ist dein erster messbarer Ausgangspunkt. Jetzt entwickeln wir ihn Schritt für Schritt weiter."}/></Text><View style={s.resultCard}><Text style={s.resultCardLabel}><Copy text={"DATENVOLLSTÄNDIGKEIT"}/></Text><Text style={s.resultCardValue}>{score?.completeness??0}%</Text></View><Text style={s.trial}><Copy text={"Als Nächstes kannst du PRO sieben Tage kostenlos testen."}/></Text></>}

    <Pressable style={[s.next,busy&&{opacity:.55}]} disabled={busy} onPress={next}><Text style={s.nextText}><Copy text={busy?"WIRD BERECHNET":step===4?"LEISTUNGSWERT BERECHNEN →":step===5?"PRO TESTEN →":"WEITER →"}/></Text></Pressable>
    {step>1&&step<5&&<Pressable onPress={()=>setStep(step-1)}><Text style={s.back}><Copy text={"← ZURÜCK"}/></Text></Pressable>}
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
  result:{color:C.ink,fontFamily:"Archivo",fontSize:104,letterSpacing:-.8,marginTop:14},resultPercent:{fontFamily:"Archivo",fontSize:38,color:C.volt},resultTitle:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:18,letterSpacing:1.4,marginBottom:18},resultCard:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",padding:16,borderRadius:radius.md,borderWidth:1,borderColor:C.line,backgroundColor:C.panel2},resultCardLabel:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,},resultCardValue:{color:C.ink,fontFamily:"Archivo",fontSize:24,},trial:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:12,lineHeight:19,marginTop:20,}
});
