import {useState} from "react";
import {Pressable,SafeAreaView,ScrollView,StyleSheet,Switch,Text,TextInput,View} from "react-native";
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

function birthToIso(value:string){
  const m=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());
  if(!m)return value.trim();
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export default function Onboarding(){
  const [step,setStep]=useState(1);
  const [goal,setGoal]=useState("Athletik");
  const [birth,setBirth]=useState("01.01.2000");
  const [height,setHeight]=useState("180");
  const [weight,setWeight]=useState("80");
  const [experience,setExperience]=useState<"STARTER"|"REGULAR"|"ADVANCED">("STARTER");
  const [availability,setAvailability]=useState(3);
  const [health,setHealth]=useState(false);
  const [pushups,setPushups]=useState("");
  const [plank,setPlank]=useState("");
  const [run5k,setRun5k]=useState("");
  const [error,setError]=useState("");

  async function finish(){
    if(!Number(pushups)||!Number(plank)){setError("Bitte Liegestütze und Unterarmstütz eintragen.");setStep(4);return;}
    try{
      await api("/api/onboarding/complete",{method:"POST",body:JSON.stringify({
        goal,birthDate:birthToIso(birth),sex:"prefer_not_to_say",heightCm:Number(height),weightKg:Number(weight),
        trainingExperience:experience,availabilityPerWeek:availability,healthConsent:health,privacyConsent:true,termsConsent:true
      })});
      await api("/api/performance-tests",{method:"POST",body:JSON.stringify({name:"STARTTEST",results:[{metric:"pushups",value:Number(pushups),unit:"Wdh"},{metric:"plank",value:Number(plank),unit:"Sekunden"},...(Number(run5k)>0?[{metric:"5k_time",value:Number(run5k),unit:"Minuten"}]:[])]})}).catch(()=>undefined);
      if(health)await syncHealth().catch(()=>{});
      router.replace("/membership?onboarding=1");
    }catch(e:any){setError(e.message||"Einrichtung fehlgeschlagen.")}
  }

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
    <Brand/>
    <View style={s.progress}>{[1,2,3,4,5].map(x=><View key={x} style={[s.bar,x<=step&&s.barOn]}/>)}</View>

    {step===1&&<><Text style={s.kicker}>01 · ZIEL</Text><Text style={s.title}>WAS WILLST{"\n"}DU ERREICHEN?</Text><View style={s.goals}>{goals.map(g=><Pressable key={g} onPress={()=>setGoal(g)} style={[s.goal,goal===g&&s.goalOn]}><Text style={[s.goalText,goal===g&&s.goalTextOn]}>{g}</Text><Text style={[s.arrow,goal===g&&s.goalTextOn]}>{goal===g?"✓":"→"}</Text></Pressable>)}</View></>}

    {step===2&&<><Text style={s.kicker}>02 · AUSGANGSLAGE</Text><Text style={s.title}>DEINE{"\n"}BASIS.</Text>
      <TextInput style={s.input} value={birth} onChangeText={setBirth} placeholder="TT.MM.JJJJ" placeholderTextColor="#555"/>
      <TextInput style={s.input} value={height} onChangeText={setHeight} keyboardType="number-pad" placeholder="Größe cm" placeholderTextColor="#555"/>
      <TextInput style={s.input} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="Gewicht kg" placeholderTextColor="#555"/>
      <Text style={s.label}>TRAININGSERFAHRUNG</Text>
      <View style={s.choiceRow}>{experienceOptions.map(x=><Pressable key={x.value} style={[s.choice,experience===x.value&&s.choiceOn]} onPress={()=>setExperience(x.value)}><Text style={[s.choiceText,experience===x.value&&s.choiceTextOn]}>{x.label}</Text></Pressable>)}</View>
      <Text style={s.label}>TRAININGSTAGE PRO WOCHE · {availability}</Text>
      <View style={s.choiceRow}>{[2,3,4,5,6].map(x=><Pressable key={x} style={[s.choice,availability===x&&s.choiceOn]} onPress={()=>setAvailability(x)}><Text style={[s.choiceText,availability===x&&s.choiceTextOn]}>{x}</Text></Pressable>)}</View>
    </>}

    {step===3&&<><Text style={s.kicker}>03 · DATEN</Text><Text style={s.title}>GESUNDHEIT{"\n"}VERBINDEN.</Text><Text style={s.copy}>Schlaf, HRV, Ruhepuls, Schritte, VO2max und Gewicht werden nur nach deiner Einwilligung genutzt.</Text><View style={s.switch}><Text style={s.switchText}>GESUNDHEITSDATEN ERLAUBEN</Text><Switch value={health} onValueChange={setHealth} trackColor={{true:C.volt}} thumbColor={health?C.bg:"#eee"}/></View></>}

    {step===4&&<><Text style={s.kicker}>04 · STARTTEST</Text><Text style={s.title}>DEIN ERSTER{"\n"}MESSPUNKT.</Text><Text style={s.copy}>Führe zwei einfache Tests sauber aus. Der 5 km Lauf ist optional.</Text><TextInput style={s.input} value={pushups} onChangeText={setPushups} keyboardType="number-pad" placeholder="Liegestütze Wiederholungen" placeholderTextColor="#555"/><TextInput style={s.input} value={plank} onChangeText={setPlank} keyboardType="number-pad" placeholder="Unterarmstütz Sekunden" placeholderTextColor="#555"/><TextInput style={s.input} value={run5k} onChangeText={setRun5k} keyboardType="decimal-pad" placeholder="5 km Lauf Minuten optional" placeholderTextColor="#555"/>{error?<Text style={s.error}>{error}</Text>:null}</>}

    {step===5&&<><Text style={s.kicker}>05 · BEREIT</Text><Text style={s.title}>WERDE{"\n"}ANDERS.</Text><Text style={s.copy}>Dein erster Leistungswert entsteht nur aus echten Daten. Fehlende Werte bleiben sichtbar unvollständig.</Text>{error?<Text style={s.error}>{error}</Text>:null}</>}

    <Pressable style={s.next} onPress={()=>step<5?setStep(step+1):finish()}><Text style={s.nextText}>{step<5?"WEITER →":"SYSTEM ÖFFNEN →"}</Text></Pressable>
    {step>1&&<Pressable onPress={()=>setStep(step-1)}><Text style={s.back}>← ZURÜCK</Text></Pressable>}
  </ScrollView></SafeAreaView>;
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},content:{padding:22,paddingBottom:50},
  progress:{flexDirection:"row",gap:5,marginTop:28,marginBottom:48},bar:{height:3,flex:1,backgroundColor:"#242725"},barOn:{backgroundColor:C.volt},
  kicker:{color:C.volt,fontSize:9,fontWeight:"900",letterSpacing:2},title:{color:C.ink,fontSize:58,lineHeight:50,fontWeight:"900",letterSpacing:-3.5,marginTop:12,marginBottom:30},
  goals:{gap:8},goal:{height:58,borderRadius:radius.md,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line,paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},goalOn:{backgroundColor:C.volt,borderColor:C.volt},
  goalText:{color:C.ink,fontSize:13,fontWeight:"800"},goalTextOn:{color:C.bg},arrow:{color:C.volt,fontSize:18},
  input:{height:58,borderRadius:radius.md,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line,color:C.ink,paddingHorizontal:16,marginBottom:10},
  copy:{color:C.dim,fontSize:14,lineHeight:22,marginBottom:24},switch:{height:64,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:radius.md,paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  switchText:{color:C.ink,fontSize:10,fontWeight:"900",letterSpacing:1},next:{height:58,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:30},
  nextText:{color:C.bg,fontSize:10,fontWeight:"900",letterSpacing:1.3},back:{color:C.dim,textAlign:"center",fontSize:9,fontWeight:"900",letterSpacing:1.2,marginTop:18},
  label:{color:C.dim,fontSize:9,fontWeight:"900",letterSpacing:1.3,marginTop:14},choiceRow:{flexDirection:"row",gap:6,flexWrap:"wrap"},choice:{paddingVertical:10,paddingHorizontal:10,borderRadius:12,borderWidth:1,borderColor:C.line,backgroundColor:C.panel2},
  choiceOn:{backgroundColor:C.volt,borderColor:C.volt},choiceText:{color:C.ink,fontSize:8,fontWeight:"900"},choiceTextOn:{color:C.bg},error:{color:C.red,fontSize:12,marginTop:10}
});
