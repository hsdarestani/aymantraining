import {Copy} from "../components/Locale";
import {useCallback,useState} from "react";
import {ActivityIndicator,Pressable,StyleSheet,Text,View} from "react-native";
import {router,useFocusEffect} from "expo-router";
import Screen from "../components/Screen";
import MilestoneCelebration from "../components/MilestoneCelebration";
import {api} from "../lib/api";
import {C} from "../theme";
type Milestone={id:string;title:string;message:string;visualIntensity:string;achievedAt:string};
type Progress={key:string;title:string;metric:string;progress:number;threshold:number};
export default function Milestones(){
 const [data,setData]=useState<any>(null),[status,setStatus]=useState("");
 useFocusEffect(useCallback(()=>{api("/api/milestones").then(setData).catch(e=>setStatus(e.message||"Nicht verfügbar"))},[]));
 if(!data)return <Screen><View style={s.loading}><ActivityIndicator color={C.volt}/><Text style={s.copy}>{status||"Fortschritt wird geladen ..."}</Text></View></Screen>;
 return <Screen><MilestoneCelebration/><View style={s.hero}><Text style={s.kicker}><Copy text="DEIN ECHTER FORTSCHRITT"/></Text>
   <Text style={s.title}>JEDER TAG.{"\n"}EIN SCHRITT.</Text>
   <Text style={s.copy}><Copy text="Nur Training, echte Tageschecks und zuvor geplante Erholung zählen. Das reine Öffnen der Anwendung zählt nicht."/></Text>
  </View>
  {!data.enabled?<Text style={s.copy}><Copy text="Deine Meilensteine werden vorbereitet. Deine Daten bleiben erhalten."/></Text>:<>
   <View style={s.grid}><View style={s.stat}><Text style={s.kicker}><Copy text="AKTUELLE SERIE"/></Text><Text style={s.number}>{data.streak}</Text><Text style={s.copy}><Copy text="TAGE"/></Text></View>
    <View style={s.stat}><Text style={s.kicker}><Copy text="BESTE SERIE"/></Text><Text style={s.number}>{data.best}</Text><Text style={s.copy}><Copy text="TAGE"/></Text></View></View>
   <Text style={s.copy}>{data.todayStatus==="PLANNED_RECOVERY"?"Heute zählt deine vorab geplante Erholung.":data.todayStatus==="ACHIEVED"?"Heute hast du Fortschritt dokumentiert.":"Heute liegt noch keine passende Aktivität vor."}</Text>
   <Text style={s.heading}><Copy text="DEINE MEILENSTEINE."/></Text>
   {(data.awards as Milestone[]).length===0?<Text style={s.copy}><Copy text="Dein erster bestätigter Meilenstein kommt mit einer echten Aktivität."/></Text>:
    (data.awards as Milestone[]).map(a=><View style={s.award} key={a.id}><Text style={s.kicker}><Copy text="ERREICHT"/></Text><Text style={s.awardTitle}>{a.title}</Text>
     <Text style={s.copy}>{a.message}</Text><Text style={s.kicker}>{new Date(a.achievedAt).toLocaleDateString("de-DE")}</Text></View>)}
   <Text style={s.heading}><Copy text="DEIN NÄCHSTER SCHRITT."/></Text>
   {(data.next as Progress[]).map(n=><View key={n.key} style={s.next}><View style={s.nextHeading}><Text style={s.nextLabel}>{n.title}</Text>
     <Text style={s.kicker}>{Math.min(n.progress,n.threshold)} / {n.threshold}</Text></View>
     <View style={s.track}><View style={[s.fill,{width:(Math.max(0,Math.min(100,n.progress/n.threshold*100))+"%") as `${number}%`}]}/></View>
    </View>)}
  </>}
  <Pressable style={s.action} onPress={()=>router.push("/(tabs)/training")}><Text style={s.actionText}><Copy text="TRAINING ANSEHEN →"/></Text></Pressable>
 </Screen>;
}
const s=StyleSheet.create({
 loading:{flex:1,minHeight:280,justifyContent:"center",gap:13},hero:{backgroundColor:"#182A1C",padding:20,borderTopWidth:3,borderTopColor:C.volt,marginTop:12},
 kicker:{color:"#ABD4BA",fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:1},title:{color:C.ink,fontFamily:"Archivo",fontSize:32,lineHeight:36,marginTop:15},
 copy:{fontFamily:"Manrope",fontSize:12,lineHeight:19,color:C.dim,marginTop:8},grid:{flexDirection:"row",gap:9,marginTop:15},stat:{flex:1,padding:16,backgroundColor:"#263627"},
 number:{fontFamily:"Archivo",fontSize:50,color:C.volt,marginTop:8},heading:{fontFamily:"Archivo",fontSize:25,color:C.ink,marginTop:25,marginBottom:13},
 award:{padding:18,backgroundColor:"#26382B",borderLeftWidth:3,borderLeftColor:C.volt,marginBottom:10},awardTitle:{fontFamily:"Archivo",fontSize:21,color:C.ink,marginTop:8},
 next:{backgroundColor:"#1B2920",padding:14,marginBottom:9},nextHeading:{flexDirection:"row",justifyContent:"space-between",gap:12},nextLabel:{fontFamily:"ManropeSemiBold",fontSize:12,color:C.ink,flex:1},
 track:{height:8,backgroundColor:"#405043",overflow:"hidden",borderRadius:8,marginTop:13},fill:{backgroundColor:C.volt,height:"100%"},action:{marginTop:22,backgroundColor:C.volt,padding:16,alignItems:"center"},actionText:{fontFamily:"ManropeSemiBold",fontSize:12,color:C.bg}
});
