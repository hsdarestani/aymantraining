import {Copy} from "../../components/Locale";
import {useCallback,useState} from "react";
import {Pressable,StyleSheet,Text,View} from "react-native";
import {router,useFocusEffect} from "expo-router";
import Screen from "../../components/Screen";
import {Card,Eyebrow} from "../../components/Card";
import {api} from "../../lib/api";
import {clearSession} from "../../lib/session";
import {C} from "../../theme";

const modules=[
 {label:"ATHLETE DIGITAL TWIN",sub:"Radar · Ziel · Prognose",path:"/digital-twin",accent:"score"},
 {label:"BE FUEL",sub:"Ernährung · Barcode · Wasser",path:"/fuel",accent:"red"},
 {label:"BE RESTED",sub:"Schlaf · Recovery Bibliothek",path:"/lifestyle",accent:"rest"},
 {label:"BE FOCUSED",sub:"2 Min Atmung · Tagescheck",path:"/focus",accent:"red"},
 {label:"GADGETS",sub:"Apple · Samsung · Xiaomi · mehr",path:"/wearables",accent:"rest"},
 {label:"CYCLE & CONTEXT",sub:"Zyklus · Spieltag · Reise",path:"/context",accent:"red"},
 {label:"CHALLENGES",sub:"Streak · Leaderboard · Badges",path:"/community",accent:"rest"},
 {label:"COACH",sub:"Chat · Briefing · Feedback",path:"/(tabs)/coach",accent:"score"}
] as const;

function scoreColor(v:number|null|undefined){return v==null?C.dim:v<60?C.red:v<80?C.amber:C.green}

export default function Athlete(){
 const [d,setD]=useState<any>(null);
 useFocusEffect(useCallback(()=>{api<any>("/api/mobile/dashboard").then(setD).catch(()=>{})},[]));
 const s0=d?.score,p=d?.pillarPreview||{};
 const pillars=[["S",p.strength],["E",p.endurance],["A",p.athleticism],["M",p.mobility],["R",p.recovery],["F",p.fuel],["C",p.consistency]] as const;
 return <Screen>
  <View style={st.hero}><Eyebrow>ATHLETE SYSTEM</Eyebrow><Text style={st.big}>{(d?.user?.name||"DEIN ATHLET").toUpperCase()}</Text><Text style={st.heroCopy}>Alles, was deinen BD SCORE verändert, an einem Ort.</Text></View>

  <Pressable onPress={()=>router.push("/digital-twin")} style={st.identity}>
   <View><Text style={st.scoreLabel}>BD SCORE · ZIEL 100%</Text><Text style={st.score}>{s0?.total??0}<Text style={st.percent}>%</Text></Text><Text style={[st.level,{color:scoreColor(s0?.total)}]}>{s0?.level||"NORMAL"}</Text></View>
   <View style={st.miniPillars}>{pillars.map(([key,value])=><View key={key} style={st.miniPillar}><View style={st.miniTrack}><View style={[st.miniFill,{height:`${Math.max(5,value??0)}%`,backgroundColor:scoreColor(value)}]}/></View><Text style={st.miniKey}>{key}</Text></View>)}</View>
  </Pressable>

  <View style={st.grid}>{modules.map(item=><Pressable key={item.label} onPress={()=>router.push(item.path as any)} style={[st.module,item.accent==="red"&&st.moduleRed,item.accent==="score"&&st.moduleScore]}>
   <Text style={[st.moduleLabel,item.accent==="red"&&{color:C.red}]}>{item.label}</Text>
   <Text style={st.moduleSub}>{item.sub}</Text><Text style={st.arrow}>→</Text>
  </Pressable>)}</View>

  <Card><Eyebrow>MEHR</Eyebrow>
   <View style={st.actions}>
    {[
     ["TRAININGSPLÄNE","/plans"],["ÜBUNGSBIBLIOTHEK","/library"],["LEISTUNGSTESTS","/tests"],["WOCHENBERICHT","/report"],
     ["PERFORMANCE TIMELINE","/performance-timeline"],["APPLE WATCH & WIDGET","/watch"],["DIFFERENT AI","/different-ai"],
     ["EVENTS & VIDEO CALLS","/events"],["FREUNDE EINLADEN","/referral"],["WOCHENCHECK","/checkin"],
     ["EINSTELLUNGEN & DATENSCHUTZ","/settings"],["MITGLIEDSCHAFT","/membership"],["PROFIL & HEALTH DATEN","/onboarding"]
    ].map(([label,path])=><Pressable key={path} onPress={()=>router.push(path as any)} style={st.row}><Text style={st.rowText}>{label}</Text><Text style={st.rowArrow}>→</Text></Pressable>)}
    <Pressable onPress={async()=>{await clearSession();router.replace("/")}} style={st.row}><Text style={st.rowText}>ABMELDEN</Text><Text style={st.rowArrow}>→</Text></Pressable>
   </View>
  </Card>
 </Screen>
}
const st=StyleSheet.create({
 hero:{paddingVertical:18},big:{color:C.ink,fontFamily:"Archivo",fontSize:35,lineHeight:39,letterSpacing:-1,marginTop:8},heroCopy:{color:C.dim,fontFamily:"Manrope",fontSize:12,lineHeight:18,marginTop:10,maxWidth:300},
 identity:{minHeight:170,padding:20,backgroundColor:"#111517",borderTopWidth:3,borderTopColor:C.volt,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
 scoreLabel:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.4},score:{color:C.ink,fontFamily:"Archivo",fontSize:66,letterSpacing:-1.5,marginTop:4},percent:{fontSize:27,color:C.volt},level:{fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:1.2},
 miniPillars:{height:110,flexDirection:"row",alignItems:"flex-end",gap:5},miniPillar:{alignItems:"center",gap:4},miniTrack:{width:7,height:78,backgroundColor:"#272D30",justifyContent:"flex-end",overflow:"hidden",borderRadius:4},miniFill:{width:"100%",borderRadius:4},miniKey:{color:C.dim,fontFamily:"Archivo",fontSize:10},
 grid:{flexDirection:"row",flexWrap:"wrap",gap:8},module:{width:"48.5%",minHeight:118,padding:14,backgroundColor:"#111517",borderTopWidth:1,borderTopColor:C.line},moduleRed:{borderTopColor:C.red,backgroundColor:"#171113"},moduleScore:{borderTopColor:C.volt},moduleLabel:{color:C.ink,fontFamily:"Archivo",fontSize:15,lineHeight:18},moduleSub:{color:C.dim,fontFamily:"Manrope",fontSize:10,lineHeight:14,marginTop:7,paddingRight:10},arrow:{position:"absolute",right:12,bottom:10,color:C.volt,fontFamily:"ManropeSemiBold",fontSize:16},
 actions:{marginTop:8},row:{height:50,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:C.line},rowText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:.9},rowArrow:{color:C.red,fontFamily:"Manrope",fontSize:17}
});
