import {useMemo,useState} from "react";
import {Pressable,StyleSheet,Text,View} from "react-native";
import Svg,{Circle,Line,Path} from "react-native-svg";
import {router} from "expo-router";
import {Copy} from "./Locale";
import {C} from "../theme";

type Session={id?:string;title?:string;completed?:boolean;scheduledAt?:string};
type Day={date:string;workouts?:Session[]};

const captions=["GESTERN","HEUTE","MORGEN"];
const accent="#D4FF00";
const lettering="#E7F4DF";
function number(date:string){const part=date.slice(8,10);return /^\d{2}$/.test(part)?part:"—"}
function month(date:string){const n=Number(date.slice(5,7));return ["","JAN","FEB","MÄR","APR","MAI","JUN","JUL","AUG","SEP","OKT","NOV","DEZ"][n]||""}

export default function RhythmHorizon({days}:{days:Day[]}){
 const [selected,setSelected]=useState(1);
 const normalized=useMemo(()=>days.slice(0,3),[days]);
 const active=Math.min(selected,Math.max(0,normalized.length-1));
 const chosen=normalized[active];
 if(!chosen)return null;
 const workouts=chosen.workouts||[];
 const session=workouts[0];
 return <View style={s.frame}>
  <View style={s.heading}>
   <Text style={s.serial}>02 / <Copy text="DEIN TRAININGSFENSTER"/></Text>
   <Text style={s.headingMain}><Copy text="DEINE LAST."/></Text>
   <Text style={s.headingAccent}><Copy text="DEIN RHYTHMUS."/></Text>
   <Text style={s.intro}><Copy text="Drei Tage. Ein Rhythmus. Bewegung und Erholung gehören zusammen."/></Text>
  </View>
  <View style={s.timeline} accessibilityRole="tablist">
   {normalized.map((day,i)=>{
    const isActive=i===active;
    const hasWorkout=Boolean(day.workouts?.length);
    return <Pressable key={day.date||i} onPress={()=>setSelected(i)} accessibilityRole="tab" accessibilityState={{selected:isActive}} accessibilityLabel={captions[i]+" "+number(day.date)} style={[s.stop,isActive&&s.stopActive,i===0&&s.stopFirst]}>
      <Text style={[s.stopIndex,isActive&&s.activeIndex]}>0{i+1}/03</Text>
      <Text style={s.stopLabel}><Copy text={captions[i]}/></Text>
      <Text style={[s.stopDate,isActive&&s.stopDateActive]}>{number(day.date)}</Text>
      <View style={[s.stopLine,isActive&&s.stopLineActive]}/>
      <Text style={[s.stopStatus,hasWorkout&&s.stopStatusPlanned]}><Copy text={hasWorkout?"EINHEIT":"FREI"}/></Text>
     </Pressable>;
   })}
  </View>
  <View style={s.stage}>
    <View style={s.dateRail}><Text style={s.dateKicker}><Copy text="AUSGEWÄHLTER TAG"/></Text><View style={s.bigDate}><Text style={s.bigDateNumber}>{number(chosen.date)}</Text><Text style={s.bigMonth}>{month(chosen.date)}</Text></View></View>
    <View style={s.stageMain}>
      <Text style={s.stageLabel}><Copy text={session?"BEWEGUNG GEPLANT":"ERHOLUNG IM PLAN"}/></Text>
      <Text style={s.stageTitle} numberOfLines={3}>{session?.title||<Copy text="KEIN TRAINING. TROTZDEM FORTSCHRITT."/>}</Text>
      <Text style={s.stageDetails}>{session?<><Copy text={workouts.length===1?"1 TRAININGSEINHEIT":"TRAININGSEINHEITEN"}/>{workouts.length>1?" · "+workouts.length:""}{session.completed?" · ERLEDIGT":""}</>:<Copy text="Regeneration gehört zum Plan. Keine Schätzwerte ohne Messdaten."/>}</Text>
      <Pressable accessibilityRole="button" onPress={()=>router.push(session?.id?("/workout/"+session.id) as any:"/(tabs)/training")} style={s.action}>
       <Text style={s.actionLabel}><Copy text={session?"EINHEIT ÖFFNEN":"TRAININGSPLAN ANSEHEN"}/></Text><Text style={s.actionArrow}>↗</Text>
      </Pressable>
    </View>
    <Svg width={90} height={90} viewBox="0 0 90 90" style={s.target} pointerEvents="none">
     <Circle cx={45} cy={45} r={36} stroke="#455647" fill="none" strokeWidth={1}/>
     <Circle cx={45} cy={45} r={22} stroke="#485d4a" fill="none" strokeWidth={1} strokeDasharray="2 5"/>
     <Line x1={45} y1={4} x2={45} y2={86} stroke="#425543" strokeWidth={1}/>
     <Line x1={4} y1={45} x2={86} y2={45} stroke="#425543" strokeWidth={1}/>
     <Path d="M45 9 A36 36 0 0 1 81 45" stroke={accent} strokeWidth={3} fill="none"/>
     <Circle cx={45} cy={45} r={4} fill={accent}/>
    </Svg>
  </View>
  <Text style={s.disclaimer}>↳  <Copy text="Echte Trainingseinheiten. Keine erfundenen Belastungswerte."/></Text>
 </View>;
}

const s=StyleSheet.create({
 frame:{marginTop:26,marginBottom:24,borderTopWidth:1,borderBottomWidth:1,borderColor:"#405042"},
 heading:{paddingTop:22,paddingHorizontal:2,paddingBottom:17},
 serial:{fontFamily:"ManropeSemiBold",color:"#AABFAC",fontSize:9,letterSpacing:1.6},
 headingMain:{color:lettering,fontFamily:"Archivo",fontSize:39,lineHeight:43,letterSpacing:-1.9,marginTop:13},
 headingAccent:{color:accent,fontFamily:"Archivo",fontSize:39,lineHeight:43,letterSpacing:-1.9},
 intro:{fontFamily:"Manrope",fontSize:11,color:"#9CAC9E",lineHeight:17,marginTop:12,maxWidth:320},
 timeline:{flexDirection:"row",borderTopWidth:2,borderTopColor:"#6F9361"},
 stop:{flex:1,minWidth:0,paddingTop:14,paddingBottom:17,paddingHorizontal:8,borderRightWidth:1,borderRightColor:"#374337",backgroundColor:"#101613"},
 stopFirst:{paddingLeft:4},stopActive:{backgroundColor:"#22311C"},
 stopIndex:{fontFamily:"ManropeSemiBold",fontSize:9,color:"#7C9A81",letterSpacing:.6},
 activeIndex:{color:accent},stopLabel:{fontFamily:"ManropeSemiBold",fontSize:10,color:"#C3CDC3",letterSpacing:.5,marginTop:8},
 stopDate:{fontFamily:"Archivo",fontSize:46,lineHeight:52,color:lettering,letterSpacing:-2.7,marginTop:1},
 stopDateActive:{color:accent},
 stopLine:{height:2,width:24,backgroundColor:"#516252",marginTop:9},stopLineActive:{backgroundColor:accent,width:40},
 stopStatus:{fontFamily:"ManropeSemiBold",fontSize:9,color:"#ADBAB0",marginTop:10},
 stopStatusPlanned:{color:accent},
 stage:{minHeight:225,backgroundColor:"#151D17",padding:18,overflow:"hidden",borderBottomWidth:2,borderBottomColor:"#637D53"},
 dateRail:{borderBottomWidth:1,borderBottomColor:"#445744",paddingBottom:12,marginBottom:15},
 dateKicker:{fontFamily:"ManropeSemiBold",fontSize:9,color:"#96A998",letterSpacing:1.1},
 bigDate:{flexDirection:"row",alignItems:"baseline",gap:13},
 bigDateNumber:{fontFamily:"Archivo",fontSize:76,lineHeight:78,color:lettering,letterSpacing:-4},
 bigMonth:{fontFamily:"Archivo",fontSize:22,color:accent},
 stageMain:{zIndex:2,paddingRight:25},stageLabel:{fontFamily:"ManropeSemiBold",fontSize:9,color:accent,letterSpacing:1.5},
 stageTitle:{fontFamily:"Archivo",fontSize:25,lineHeight:29,letterSpacing:-.6,color:lettering,marginTop:9},
 stageDetails:{fontFamily:"Manrope",fontSize:11,color:"#AFC0AF",lineHeight:16,marginTop:11},
 action:{flexDirection:"row",alignItems:"center",alignSelf:"flex-start",gap:17,backgroundColor:accent,marginTop:17,paddingVertical:11,paddingHorizontal:13},
 actionLabel:{fontFamily:"ManropeSemiBold",fontSize:10,color:"#172016",letterSpacing:.2},actionArrow:{fontFamily:"Archivo",fontSize:18,color:"#172016"},
 target:{position:"absolute",right:-16,bottom:40,opacity:.48},
 disclaimer:{fontFamily:"Manrope",fontSize:9,color:"#92A694",paddingTop:13,paddingBottom:14}
});
