import {Copy} from "../../components/Locale";
import {useCallback,useState} from "react";
import {Pressable,StyleSheet,Text,View} from "react-native";
import {router,useFocusEffect} from "expo-router";
import Screen from "../../components/Screen";
import {Card,Eyebrow} from "../../components/Card";
import {api} from "../../lib/api";
import {clearSession} from "../../lib/session";
import {C} from "../../theme";
import AthleteTwin from "../../components/AthleteTwin";

const modules=[
 {label:"BE AWAKE",sub:"Morgenroutine · Tagesstart",path:"/awake",accent:"awake"},
 {label:"BE FUEL",sub:"Ernährung · Barcode · Wasser",path:"/fuel",accent:"red"},
 {label:"BE RESTED",sub:"Schlaf · Regenerationsbibliothek",path:"/lifestyle",accent:"rest"},
 {label:"BE FOCUSED",sub:"2 Min Atmung · Tagescheck",path:"/focus",accent:"red"},
 {label:"APPLE HEALTH & GADGETS",sub:"Apple Health · Schlaf · Schritte · mehr",path:"/wearables",accent:"rest"},
 {label:"ZYKLUS & KONTEXT",sub:"Zyklus · Spieltag · Reise",path:"/context",accent:"red"},
 {label:"HERAUSFORDERUNGEN",sub:"Serie · Rangliste · Abzeichen",path:"/community",accent:"rest"},
 {label:"COACH",sub:"Chat · Überblick · Rückmeldung",path:"/(tabs)/coach",accent:"score"}
] as const;

function scoreColor(v:number|null|undefined){return v==null?C.dim:v<60?C.red:v<80?C.amber:C.green}

export default function Athlete(){
 const [d,setD]=useState<any>(null);
 useFocusEffect(useCallback(()=>{api<any>("/api/mobile/dashboard").then(setD).catch(()=>{})},[]));
 const s0=d?.score,p=d?.pillarPreview||{};
 const pillars=[["S",p.strength],["E",p.endurance],["A",p.athleticism],["M",p.mobility],["R",p.recovery],["F",p.fuel],["C",p.consistency]] as const;
 return <Screen>
  <View style={st.hero}><Eyebrow><Copy text="BE DIFFERENT / DEIN SYSTEM"/></Eyebrow><Text style={st.big}><Copy text="ALLES. FÜR"/>{"\n"}<Copy text="DEIN LEVEL."/></Text><Text style={st.heroCopy}><Copy text="START zeigt deinen Tag. ATHLET öffnet deine Routinen, Ernährung, Regeneration und alle Module."/></Text></View>
  <View style={st.entryRow}>
   <Pressable accessibilityRole="button" onPress={()=>router.push("/awake")} style={st.entryAwake}><Text style={st.entryCount}>01 / MORGEN</Text><Text style={st.entryTitle}><Copy text="BE AWAKE"/></Text><Text style={st.entryDetail}><Copy text="STARTE DEINEN TAG ↗"/></Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>router.push("/fuel")} style={st.entryFuel}><Text style={st.entryCount}>02 / ENERGIE</Text><Text style={st.entryTitle}><Copy text="BE FUEL"/></Text><Text style={st.entryDetail}><Copy text="ERNÄHRUNG ÖFFNEN ↗"/></Text></Pressable>
  </View>

  <Pressable onPress={()=>router.push("/digital-twin")} style={st.identity}>
   <View><Text style={st.scoreLabel}><Copy text="BD SCORE · ZIEL 100%"/></Text><Text style={st.score}>{s0?.total??0}<Text style={st.percent}>%</Text></Text><Text style={[st.level,{color:scoreColor(s0?.total)}]}><Copy text={s0?.level||"NORMAL"}/></Text></View>
   <View style={st.miniPillars}>{pillars.map(([key,value])=><View key={key} style={st.miniPillar}><View style={st.miniTrack}><View style={[st.miniFill,{height:`${Math.max(5,value??0)}%`,backgroundColor:scoreColor(value)}]}/></View><Text style={st.miniKey}>{key}</Text></View>)}</View>
  </Pressable>

  <Pressable accessibilityRole="button" onPress={()=>router.push("/digital-twin")} style={st.twinStage}>
    <AthleteTwin compact/><View style={st.twinCopy}><Text style={st.twinOverline}>DIGITALES ABBILD / 01</Text><Text style={st.twinTitle}><Copy text="DEIN DIGITALER ATHLET"/></Text><Text style={st.twinDescription}><Copy text="Animierte Vorschau öffnen und Leistungsprofil erkunden."/></Text><Text style={st.twinAction}><Copy text="ERKUNDEN ↗"/></Text></View>
   </Pressable>
  <Eyebrow><Copy text="DEINE MODULE / ENTDECKEN"/></Eyebrow>
  <View style={st.grid}>{modules.map((item,i)=><Pressable accessibilityRole="button" key={item.label} onPress={()=>router.push(item.path as any)} style={[st.module,item.accent==="red"&&st.moduleRed,item.accent==="score"&&st.moduleScore,item.accent==="awake"&&st.moduleAwake]}>
   <Text style={st.moduleNumber}>0{i+1}</Text>
   <Text style={[st.moduleLabel,item.accent==="red"&&{color:C.red},item.accent==="awake"&&{color:C.volt}]}><Copy text={item.label}/></Text>
   <Text style={st.moduleSub}><Copy text={item.sub}/></Text><Text style={st.arrow}>↗</Text>
  </Pressable>)}</View>

  <Card><Eyebrow><Copy text="MEHR"/></Eyebrow>
   <View style={st.actions}>
    {[
     ["TRAININGSPLÄNE","/plans"],["ÜBUNGSBIBLIOTHEK","/library"],["LEISTUNGSTESTS","/tests"],["WOCHENBERICHT","/report"],
     ["LEISTUNGSVERLAUF","/performance-timeline"],["APPLE WATCH & WIDGET","/watch"],["DIFFERENT AI","/different-ai"],
     ["TERMINE & VIDEOANRUFE","/events"],["FREUNDE EINLADEN","/referral"],["WOCHENCHECK","/checkin"],
     ["EINSTELLUNGEN & DATENSCHUTZ","/settings"],["KONTOSTATUS","/membership"],["PROFIL & GESUNDHEITSDATEN","/onboarding"]
    ].map(([label,path])=><Pressable key={path} onPress={()=>router.push(path as any)} style={st.row}><Text style={st.rowText}><Copy text={label}/></Text><Text style={st.rowArrow}>→</Text></Pressable>)}
    <Pressable onPress={async()=>{await clearSession();router.replace("/")}} style={st.row}><Text style={st.rowText}><Copy text="ABMELDEN"/></Text><Text style={st.rowArrow}>→</Text></Pressable>
   </View>
  </Card>
 </Screen>
}
const st=StyleSheet.create({
 hero:{paddingVertical:18},big:{color:C.ink,fontFamily:"Archivo",fontSize:35,lineHeight:39,letterSpacing:-1,marginTop:8},heroCopy:{color:C.dim,fontFamily:"Manrope",fontSize:12,lineHeight:18,marginTop:10,maxWidth:300},
 identity:{minHeight:170,padding:20,backgroundColor:"#111517",borderTopWidth:3,borderTopColor:C.volt,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
 entryRow:{flexDirection:"row",gap:10,marginBottom:5},entryAwake:{flex:1,minHeight:150,borderRadius:20,borderWidth:1,borderColor:"#5A562C",backgroundColor:"#27271A",padding:16,justifyContent:"space-between"},entryFuel:{flex:1,minHeight:150,borderRadius:20,borderWidth:1,borderColor:"#663037",backgroundColor:"#2B171C",padding:16,justifyContent:"space-between"},entryCount:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.2},entryTitle:{color:C.ink,fontFamily:"Archivo",fontSize:26,letterSpacing:-.6},entryDetail:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:.7},
 scoreLabel:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.4},score:{color:C.ink,fontFamily:"Archivo",fontSize:66,letterSpacing:-1.5,marginTop:4},percent:{fontSize:27,color:C.volt},level:{fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:1.2},
 miniPillars:{height:110,flexDirection:"row",alignItems:"flex-end",gap:5},miniPillar:{alignItems:"center",gap:4},miniTrack:{width:7,height:78,backgroundColor:"#272D30",justifyContent:"flex-end",overflow:"hidden",borderRadius:4},miniFill:{width:"100%",borderRadius:4},miniKey:{color:C.dim,fontFamily:"Archivo",fontSize:10},
 twinStage:{minHeight:234,overflow:"hidden",flexDirection:"row",alignItems:"center",backgroundColor:"#101815",borderWidth:1,borderColor:"#40572B",borderRadius:20,marginBottom:5},
 twinCopy:{flex:1,paddingRight:13,paddingVertical:18},
 twinOverline:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.1},
 twinTitle:{color:C.ink,fontFamily:"Archivo",fontSize:21,lineHeight:23,marginTop:13},
 twinDescription:{color:C.dim,fontFamily:"Manrope",fontSize:11,lineHeight:17,marginTop:9},
 twinAction:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:11,marginTop:15},
 grid:{flexDirection:"row",flexWrap:"wrap",gap:9},module:{width:"48.5%",minHeight:151,padding:16,backgroundColor:"#111517",borderWidth:1,borderColor:"#2A3335",borderRadius:16,justifyContent:"flex-end",overflow:"hidden"},moduleRed:{borderColor:"#442832",backgroundColor:"#241316"},moduleScore:{borderColor:"#3A4D24",backgroundColor:"#192218"},moduleAwake:{borderColor:"#5A4B1E",backgroundColor:"#26271A"},moduleNumber:{position:"absolute",right:9,top:4,color:"#FFFFFF12",fontFamily:"Archivo",fontSize:50},moduleLabel:{color:C.ink,fontFamily:"Archivo",fontSize:15,lineHeight:18},moduleSub:{color:C.dim,fontFamily:"Manrope",fontSize:10,lineHeight:14,marginTop:7,paddingRight:10},arrow:{position:"absolute",right:12,bottom:10,color:C.volt,fontFamily:"ManropeSemiBold",fontSize:16},
 actions:{marginTop:8},row:{height:50,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:C.line},rowText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:.9},rowArrow:{color:C.red,fontFamily:"Manrope",fontSize:17}
});
