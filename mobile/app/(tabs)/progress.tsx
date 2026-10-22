import {Copy} from "../../components/Locale";
import {useCallback,useState} from "react";
import {Pressable,StyleSheet,Text,View} from "react-native";
import {router,useFocusEffect} from "expo-router";
import Screen from "../../components/Screen";
import {api} from "../../lib/api";
import {C} from "../../theme";

const rows=[
 ["KRAFT","strength"],["AUSDAUER","endurance"],["ATHLETIK","athleticism"],
 ["BEWEGLICHKEIT","mobility"],["REGENERATION","recovery"],["ERNÄHRUNG","fuel"],["KONSTANZ","consistency"]
] as const;

export default function Progress(){
 const [d,setD]=useState<any>({});
 useFocusEffect(useCallback(()=>{
  Promise.all([api<any>("/api/mobile/dashboard"),api<any>("/api/body-metrics"),api<any>("/api/performance-tests")])
   .then(([dash,body,tests])=>setD({dash,body:body.items,tests:tests.items})).catch(()=>{});
 },[]));
 const score=d.dash?.score,body=d.body?.[0],locked=d.dash?.scoreDetailsLocked;
 const profile=d.dash?.dailyProfile;
 const total=profile?.profile?.value??null;
 const action=(label:string,route:string)=><Pressable accessibilityRole="button" onPress={()=>router.push(route as any)} style={s.action}><Text style={s.actionText}><Copy text={label}/></Text><Text style={s.actionArrow}>↗</Text></Pressable>;
 return <Screen>
  <View style={s.hero}>
    <Text style={s.serial}>03 / <Copy text="FORTSCHRITT"/></Text>
    <Text style={s.heroSolid}><Copy text="DEIN GRIND."/></Text>
    <Text style={s.heroOutline}><Copy text="DEINE SPUREN."/></Text>
    <Text style={s.heroNote}><Copy text="Hier zählt, was du wirklich erreicht hast. Kein Vergleich, kein erfundener Trend."/></Text>
  </View>

  <Pressable accessibilityRole="button" onPress={()=>router.push("/digital-twin")} style={s.scoreStage}>
    <Text style={s.serial}>01 / <Copy text="LEISTUNGSWERT"/></Text>
    <View style={s.scoreRow}><Text style={s.scoreNumber}>{total==null?"?":Math.round(total)}</Text><View style={s.scoreUnit}><Text style={s.scoreScale}>{total==null?"":" / 100"}</Text><Text style={s.scoreCaption}><Copy text="DEIN AKTUELLER WERT"/></Text></View></View>
    <View style={s.scoreRule}><View style={[s.scoreFill,{width:`${Math.max(0,Math.min(100,Number(total??0)))}%`}]}/></View>
    <Text style={s.scoreFoot}><Copy text="DIGITALEN ATHLETEN ÖFFNEN"/>  ↗</Text>
  </Pressable>

  <View style={s.records}><Text style={s.serial}>BD SCORE: LANGFRISTIGES LEISTUNGSPROFIL</Text><Text style={s.muted}>MESSSTAND: {profile?.profile.recordedDate??"Keine Angabe"} · DATENABDECKUNG: {profile?.profile.completeness??0}%</Text><Text style={s.muted}>HEUTE: {profile?.plan?.scheduled?profile.plan.completed+" / "+profile.plan.scheduled+" geplante Einheiten":"Keine Einheit geplant"} · BESTÄTIGTES LEVEL: {profile?.journey?.confirmedLevel??"Noch nicht bestätigt"}</Text>
   <View style={s.section}><Text style={s.serial}>02 / <Copy text="KÖRPERDATEN"/></Text><Text style={s.sectionTitle}><Copy text="FAKTEN STATT GEFÜHL."/></Text></View>
   <View style={s.facts}>
     <View style={s.fact}><Text style={s.factName}><Copy text="GEWICHT"/></Text><Text style={s.factNumber}>{body?.weightKg??"?"}<Text style={s.factUnit}>{body?.weightKg==null?"":" KG"}</Text></Text></View>
     <View style={s.fact}><Text style={s.factName}><Copy text="MESSUNGEN"/></Text><Text style={s.factNumber}>{d.body?.length??0}</Text></View>
     <View style={s.fact}><Text style={s.factName}><Copy text="TESTS"/></Text><Text style={s.factNumber}>{d.tests?.length??0}</Text></View>
   </View>
  </View>

  <View style={s.profile}>
   <View style={s.section}><Text style={s.serial}>03 / <Copy text="LEISTUNGSPROFIL"/></Text><Text style={s.sectionTitle}><Copy text="DEINE DISZIPLINEN."/></Text></View>
   {locked?<View style={s.locked}>
      <Text style={s.lockedTitle}><Copy text="MEHR TIEFE. DEIN PRO."/></Text>
      <Text style={s.muted}><Copy text="Dein Gesamtwert ist sichtbar. Einzelwerte und die Erläuterungen gehören zu PRO."/></Text>
      {action("DETAILS ANSEHEN","/pricing")}
   </View>:rows.map(([label,key],i)=>{
    const value=score?.[key];
    return <View key={key} style={s.recordRow}>
      <Text style={s.recordIndex}>{String(i+1).padStart(2,"0")}</Text>
      <View style={s.recordBody}><Text style={s.recordName}><Copy text={label}/></Text>
       <View style={s.recordTrack}><View style={[s.recordFill,{width:`${Math.max(0,Math.min(100,Number(value??0)))}%`}]}/></View>
      </View>
      <Text style={s.recordValue}>{value==null?"?":Math.round(Number(value))}</Text>
    </View>;
   })}
  </View>

  <View style={s.tests}>
   <View style={s.section}><Text style={s.serial}>04 / BE DIFFERENT TEST</Text><Text style={s.sectionTitle}><Copy text="DEINE PRÜFSTEINE."/></Text></View>
   {(d.tests||[]).length?(d.tests||[]).slice(0,6).map((t:any,i:number)=><View key={t.id} style={s.testRow}>
     <Text style={s.testIndex}>{String(i+1).padStart(2,"0")}</Text>
     <View style={s.testInfo}><Text style={s.testName}>{t.name}</Text><Text style={s.muted}>{t.completedAt?new Date(t.completedAt).toLocaleDateString("de-DE"):"GEPLANT"}</Text></View>
     <Text style={s.testValue}>{t.results?.[0]?.value??"?"} {t.results?.[0]?.unit??""}</Text>
   </View>):<Text style={s.noTests}><Copy text="Noch kein Test gespeichert. Dein erster Messpunkt wartet."/></Text>}
   {action("ALLE TESTS ÖFFNEN","/tests")}
  </View>
  <View style={s.nav}><Text style={s.serial}>05 / <Copy text="WEITER ENTDECKEN"/></Text>
    {action("VORHER NACHHER VERGLEICH","/progress-photos")}
    {action("DIGITALER ATHLET","/digital-twin")}
    {action("LEISTUNGSVERLAUF","/performance-timeline")}
    {action("WOCHENBERICHT","/report")}
  </View>
 </Screen>;
}

const acid=C.volt;
const s=StyleSheet.create({
 serial:{fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.4,color:"#A6BEAA"},
 hero:{borderTopWidth:2,borderTopColor:acid,paddingTop:25,paddingBottom:29,marginTop:12,marginBottom:16,backgroundColor:"#121913",paddingHorizontal:11},
 heroSolid:{fontFamily:"Archivo",fontSize:44,lineHeight:48,letterSpacing:-1.8,color:"#F3F6E9",marginTop:16},
 heroOutline:{fontFamily:"Archivo",fontSize:44,lineHeight:48,letterSpacing:-1.8,color:acid},
 heroNote:{fontFamily:"Manrope",fontSize:12,lineHeight:19,color:"#A4B7A7",marginTop:16,maxWidth:320},
 scoreStage:{borderBottomWidth:2,borderBottomColor:acid,paddingVertical:22,paddingHorizontal:10,backgroundColor:"#182119",marginBottom:28},
 scoreRow:{flexDirection:"row",alignItems:"flex-end",gap:13,marginTop:10},
 scoreNumber:{color:acid,fontFamily:"Archivo",fontSize:105,lineHeight:111,letterSpacing:-6},
 scoreUnit:{flex:1,paddingBottom:19},
 scoreScale:{color:"#D1E9C0",fontFamily:"ManropeSemiBold",fontSize:16},
 scoreCaption:{color:"#94A895",fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:.7,marginTop:9},
 scoreRule:{height:4,backgroundColor:"#3D4C3B"},scoreFill:{height:"100%",backgroundColor:acid},
 scoreFoot:{color:acid,fontFamily:"ManropeSemiBold",fontSize:10,marginTop:18,letterSpacing:1},
 section:{marginBottom:18},sectionTitle:{fontFamily:"Archivo",color:"#F0F4E9",fontSize:30,lineHeight:34,letterSpacing:-.8,marginTop:8},
 records:{marginBottom:33},facts:{flexDirection:"row",borderTopWidth:1,borderBottomWidth:1,borderColor:"#4A5E47"},
 fact:{flex:1,minHeight:125,paddingVertical:18,paddingLeft:8,borderRightWidth:1,borderRightColor:"#3B4B39"},
 factName:{fontFamily:"ManropeSemiBold",fontSize:8,color:"#A5B6A6",letterSpacing:.6},
 factNumber:{fontFamily:"Archivo",fontSize:35,color:"#F2F6EB",marginTop:13,letterSpacing:-1.5},
 factUnit:{fontFamily:"ManropeSemiBold",fontSize:9,color:"#9BAC9B"},
 profile:{marginBottom:35},recordRow:{flexDirection:"row",alignItems:"center",borderTopWidth:1,borderTopColor:"#364536",minHeight:78,gap:12},
 recordIndex:{fontFamily:"Archivo",fontSize:25,color:"#6B8868",width:32},
 recordBody:{flex:1},recordName:{fontFamily:"ManropeSemiBold",fontSize:11,color:"#E8F0E4",letterSpacing:.5},
 recordTrack:{height:3,backgroundColor:"#354436",marginTop:10},recordFill:{height:"100%",backgroundColor:acid},
 recordValue:{fontFamily:"Archivo",fontSize:26,color:"#E9F4D8",minWidth:36,textAlign:"right"},
 locked:{borderTopWidth:1,borderTopColor:"#718553",paddingVertical:25},
 lockedTitle:{fontFamily:"Archivo",color:acid,fontSize:27,letterSpacing:-.4},
 muted:{fontFamily:"Manrope",fontSize:10,color:"#99AC9C",lineHeight:16,marginTop:5},
 action:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:"#3B4C3C",minHeight:53},
 actionText:{fontFamily:"ManropeSemiBold",fontSize:10,color:"#E4F0DE",letterSpacing:.7},actionArrow:{fontFamily:"Archivo",color:acid,fontSize:21},
 tests:{marginBottom:27},testRow:{flexDirection:"row",alignItems:"center",gap:12,borderTopWidth:1,borderTopColor:"#3B4C3C",minHeight:79},
 testIndex:{fontFamily:"Archivo",fontSize:25,color:"#618260",width:35},
 testInfo:{flex:1},testName:{color:"#E8F0E4",fontFamily:"Archivo",fontSize:14},
 testValue:{color:acid,fontFamily:"Archivo",fontSize:17},
 noTests:{fontFamily:"Manrope",fontSize:12,color:"#A5B5A6",paddingVertical:23,borderTopWidth:1,borderColor:"#3B4C3C"},
 nav:{marginBottom:30}
});
