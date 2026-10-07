import {translate,useLocale} from "../lib/i18n/locale";

import {Copy,LocalizedValue} from "../components/Locale";


import {useEffect,useMemo,useState} from "react";
import {Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";
import Svg,{Circle,Line,Polygon,Text as SvgText} from "react-native-svg";
import {router} from "expo-router";
import Brand from "../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api} from "../lib/api";
import {C,radius} from "../theme";

const labels=[["strength","KRAFT"],["endurance","AUSDAUER"],["athleticism","ATHLETIK"],["mobility","BEWEGLICHKEIT"],["recovery","RECOVERY"],["fuel","FUEL"],["consistency","KONSTANZ"]] as const;
const signal=(v:number)=>v<60?{color:C.red,label:"ROT"}:v<80?{color:C.amber,label:"GELB"}:{color:C.green,label:"GRÜN"};
function points(values:Record<string,number>,radius:number,cx=150,cy=150){return labels.map(([key],i)=>{const a=-Math.PI/2+i*2*Math.PI/labels.length;const r=radius*Math.max(0,Math.min(100,values[key]||0))/100;return `${cx+Math.cos(a)*r},${cy+Math.sin(a)*r}`}).join(" ")}
function Radar({current,target}:{current:Record<string,number>;target:Record<string,number>}){useLocale();
 return <Svg width="100%" height={330} viewBox="0 0 300 330">
  {[25,50,75,100].map(p=><Circle key={p} cx="150" cy="150" r={1.12*p} fill="none" stroke="#2A2D2C" strokeWidth="1"/>)}
  {labels.map(([_,label],i)=>{const a=-Math.PI/2+i*2*Math.PI/labels.length;const x=150+Math.cos(a)*112,y=150+Math.sin(a)*112;const tx=150+Math.cos(a)*145,ty=150+Math.sin(a)*145;return <Line key={"l"+i} x1="150" y1="150" x2={x} y2={y} stroke="#2A2D2C" strokeWidth="1"/>})}
  <Polygon points={points(target,112)} fill="#D4FF0010" stroke="#D4FF0066" strokeWidth="2" strokeDasharray="5 5"/>
  <Polygon points={points(current,112)} fill="#D4FF0025" stroke="#D4FF00" strokeWidth="3"/>
  {labels.map(([_,label],i)=>{const a=-Math.PI/2+i*2*Math.PI/labels.length;const tx=150+Math.cos(a)*142,ty=150+Math.sin(a)*142;return <SvgText key={label} x={tx} y={ty} fill="#9A9CA3" fontSize="7" fontWeight="800" textAnchor="middle">{translate(label)}</SvgText>})}
 </Svg>;
}
export default function DigitalTwin(){
 const [d,setD]=useState<any>(null),[error,setError]=useState("");
 useEffect(()=>{api("/api/digital-twin").then(setD).catch(e=>setError(e.message||"Nicht verfügbar"))},[]);
 const trend=useMemo(()=>{if(!d?.history?.length)return 0;return d.history.at(-1).total-d.history[0].total},[d]);
 if(error)return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}><Brand compact/><Card><SectionTitle><Copy text={"Der digitale Athlet ist PRO."}/></SectionTitle><Text style={s.copy}><Copy text={error}/></Text><Pressable style={s.primary} onPress={()=>router.push("/membership")}><Text style={s.primaryText}><Copy text={"PRO FREISCHALTEN"}/></Text></Pressable></Card></ScrollView></SafeAreaView>;
 if(!d?.current)return <SafeAreaView style={s.safe}/>;
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}><Copy text={"ZURÜCK"}/></Text></Pressable></View>
  <Eyebrow><Copy text={"DIGITALER ATHLET"}/></Eyebrow><Text style={s.title}><Copy text={"DEIN PROFIL."}/>{"\n"}<Copy text={"DEIN ZIEL."}/></Text>
  <Card><View style={s.scoreRow}><View><Text style={s.score}>{d.current.total}%</Text><Text style={[s.level,{color:signal(d.current.total).color}]}>{d.current.level}</Text></View><View style={s.target}><Text style={s.targetLabel}><Copy text={"ZIEL"}/></Text><Text style={s.targetValue}>{d.target.score}%</Text><Text style={s.date}><LocalizedValue value={new Date(d.target.date)} format="toLocaleDateString"/></Text></View></View><Radar current={d.current.pillars} target={d.target.pillars}/><View style={s.signalList}>{labels.map(([key,label])=>{const value=Number(d.current.pillars[key]||0),state=signal(value);return <View style={s.signalRow} key={key}><View style={[s.signalDot,{backgroundColor:state.color}]}/><Text style={s.signalName}>{label}</Text><Text style={s.signalValue}>{value}%</Text><Text style={[s.signalState,{color:state.color}]}>{state.label}</Text></View>})}</View><Text style={s.signalGuide}>Ampel: Rot unter 60 · Gelb 60 bis 79 · Grün ab 80. Der BD SCORE bleibt das Zielbild Richtung 100%.</Text></Card>
  <View style={s.grid}><Card style={s.half}><Eyebrow><Copy text={"90 TAGE"}/></Eyebrow><Text style={trend>=0?s.good:s.bad}>{trend>=0?"+":""}{trend}</Text><Text style={s.small}><Copy text={"PUNKTE ENTWICKLUNG"}/></Text></Card><Card style={s.half}><Eyebrow><Copy text={"PROGNOSE"}/></Eyebrow><Text style={s.projected}>{d.target.projected}%</Text><Text style={s.small}><Copy text={"BEI GLEICHEM TREND"}/></Text></Card></View>
  <Card><Eyebrow><Copy text={"KÖRPERPROFIL"}/></Eyebrow><SectionTitle><Copy text={"Messbare Entwicklung"}/></SectionTitle><View style={s.body}><View style={s.head}/><View style={s.torso}/><View style={s.arms}/><View style={s.legs}/></View><Text style={s.copy}><Copy text={"Gewicht"}/>{d.body?.weightKg??"Keine Angabe"}<Copy text={"kg · Taille"}/>{d.body?.waistCm??"Keine Angabe"}<Copy text={"cm · Körperfett"}/>{d.body?.bodyFat??"Keine Angabe"}</Text></Card>
  <Pressable style={s.secondary} onPress={()=>router.push("/context")}><Text style={s.secondaryText}><Copy text={"ZIEL UND KONTEXT ANPASSEN →"}/></Text></Pressable>
  <Text style={s.disclaimer}><Copy text={d.disclaimer}/></Text>
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:70,gap:12},top:{height:54,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},back:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,},title:{color:C.ink,fontFamily:"Archivo",fontSize:36,lineHeight:40,letterSpacing:-.8,marginVertical:12},scoreRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start"},score:{color:C.ink,fontFamily:"Archivo",fontSize:64,letterSpacing:-.8},level:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1.5},target:{alignItems:"flex-end"},targetLabel:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,},targetValue:{color:C.volt,fontFamily:"Archivo",fontSize:32,},date:{color:C.dim,fontFamily:"Manrope",fontSize:11},grid:{flexDirection:"row",gap:10},half:{flex:1},good:{color:C.green,fontFamily:"Archivo",fontSize:40,},bad:{color:C.red,fontFamily:"Archivo",fontSize:40,},projected:{color:C.volt,fontFamily:"Archivo",fontSize:40,},small:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,},body:{height:190,alignItems:"center",justifyContent:"center",marginVertical:12},head:{width:42,height:42,borderRadius:21,borderWidth:2,borderColor:C.volt},torso:{width:72,height:82,borderRadius:30,borderWidth:2,borderColor:C.volt,marginTop:5},arms:{position:"absolute",top:76,width:128,height:2,backgroundColor:C.volt},legs:{width:58,height:58,borderLeftWidth:2,borderRightWidth:2,borderColor:C.volt,marginTop:4},copy:{color:C.dim,fontFamily:"Manrope",fontSize:11,lineHeight:18},primary:{height:50,backgroundColor:C.volt,borderRadius:radius.md,alignItems:"center",justifyContent:"center",marginTop:12},primaryText:{color:C.bg,fontFamily:"ManropeSemiBold",fontSize:11,},secondary:{height:50,borderRadius:radius.md,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},secondaryText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:11,},signalList:{borderTopWidth:1,borderTopColor:C.line,paddingTop:10,gap:7},signalRow:{flexDirection:"row",alignItems:"center",gap:8},signalDot:{width:8,height:8,borderRadius:4},signalName:{flex:1,color:C.dim,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:.8},signalValue:{width:34,textAlign:"right",color:C.ink,fontFamily:"ManropeSemiBold",fontSize:10},signalState:{width:38,textAlign:"right",fontFamily:"ManropeSemiBold",fontSize:8,letterSpacing:.8},signalGuide:{color:C.dim,fontFamily:"Manrope",fontSize:9,lineHeight:14,marginTop:12},disclaimer:{color:C.dim,fontFamily:"Manrope",fontSize:11,lineHeight:13,textAlign:"center"}});
