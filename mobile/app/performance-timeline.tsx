import {useEffect,useMemo,useState} from "react";
import {Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";
import Svg,{Circle,Line,Path,Text as SvgText} from "react-native-svg";
import {router} from "expo-router";
import Brand from "../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api} from "../lib/api";
import {C,radius} from "../theme";

function Chart({items}:{items:any[]}){
 const w=320,h=170,p=18;
 const pts=useMemo(()=>items.map((x,i)=>({x:p+(w-p*2)*(items.length<=1?0:i/(items.length-1)),y:h-p-(h-p*2)*Math.max(0,Math.min(100,x.total))/100,total:x.total})),[items]);
 const path=pts.map((x,i)=>(i?"L":"M")+x.x+" "+x.y).join(" ");
 return <Svg width="100%" height={190} viewBox={`0 0 ${w} 190`}>
  {[0,25,50,75,100].map(v=>{const y=h-p-(h-p*2)*v/100;return <View key={v}/>})}
  {[0,25,50,75,100].map(v=>{const y=h-p-(h-p*2)*v/100;return <Line key={"g"+v} x1={p} x2={w-p} y1={y} y2={y} stroke="#252928" strokeWidth="1"/>})}
  {path?<><Path d={path} fill="none" stroke="#D4FF00" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>{pts.map((x,i)=><Circle key={i} cx={x.x} cy={x.y} r="4" fill="#D4FF00"/>)}</>:null}
  <SvgText x={p} y={188} fill="#777E79" fontSize="8">ÄLTER</SvgText><SvgText x={w-p} y={188} fill="#777E79" fontSize="8" textAnchor="end">HEUTE</SvgText>
 </Svg>;
}
export default function Timeline(){
 const [d,setD]=useState<any>(null),[locked,setLocked]=useState(false);
 useEffect(()=>{api<any>("/api/performance-timeline").then(setD).catch(e=>{if(String(e.message).includes("PRO"))setLocked(true)})},[]);
 if(locked)return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}><Brand compact/><Card><Eyebrow>PRO</Eyebrow><SectionTitle>Performance Timeline</SectionTitle><Text style={s.copy}>PRO verbindet Leistungswert, Tests und Körperwerte zu einem Verlauf.</Text><Pressable style={s.primary} onPress={()=>router.push("/membership")}><Text style={s.primaryText}>PRO FREISCHALTEN</Text></Pressable></Card></ScrollView></SafeAreaView>;
 if(!d)return <SafeAreaView style={s.safe}/>;
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}><View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}>ZURÜCK</Text></Pressable></View><Eyebrow>PERFORMANCE TIMELINE</Eyebrow><Text style={s.title}>ENTWICKLUNG{"\n"}AUF EINEN BLICK.</Text><Card><Eyebrow>LEISTUNGSWERT</Eyebrow><Chart items={d.scores||[]}/></Card><Card><Eyebrow>TESTS</Eyebrow><SectionTitle>Messpunkte</SectionTitle>{(d.tests||[]).slice().reverse().map((t:any)=><View style={s.row} key={t.id}><View style={{flex:1}}><Text style={s.name}>{t.name}</Text><Text style={s.date}>{new Date(t.completedAt).toLocaleDateString("de-DE")}</Text></View><Text style={s.value}>{t.results?.[0]?.value??"Keine Angabe"} {t.results?.[0]?.unit??""}</Text></View>)}</Card><Card><Eyebrow>KÖRPERWERTE</Eyebrow>{(d.body||[]).slice().reverse().slice(0,20).map((x:any)=><View style={s.row} key={x.id}><Text style={s.date}>{new Date(x.date).toLocaleDateString("de-DE")}</Text><Text style={s.value}>{x.weightKg??"Keine Angabe"} kg</Text></View>)}</Card></ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:70,gap:12},top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontSize:9,fontWeight:"900"},title:{color:C.ink,fontSize:46,lineHeight:40,fontWeight:"900",letterSpacing:-3,marginVertical:12},copy:{color:C.dim,fontSize:11,lineHeight:18,marginTop:10},primary:{height:50,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:14},primaryText:{color:C.bg,fontSize:9,fontWeight:"900"},row:{minHeight:58,flexDirection:"row",alignItems:"center",gap:10,borderBottomWidth:1,borderBottomColor:C.line},name:{color:C.ink,fontSize:11,fontWeight:"900"},date:{color:C.dim,fontSize:8},value:{color:C.volt,fontSize:11,fontWeight:"900"}});
