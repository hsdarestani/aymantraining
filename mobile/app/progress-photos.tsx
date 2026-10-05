
import {Copy,LocalizedValue} from "../components/Locale";


import {useEffect,useMemo,useRef,useState} from "react";
import {Image,PanResponder,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";
import {router} from "expo-router";
import Brand from "../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api,API} from "../lib/api";
import {getSession} from "../lib/session";
import {C,radius} from "../theme";

export default function ProgressPhotos(){
 const [items,setItems]=useState<any[]>([]),[token,setToken]=useState(""),[ratio,setRatio]=useState(.5),[width,setWidth]=useState(1);
 useEffect(()=>{Promise.all([api<any>("/api/media?kind=PROGRESS_PHOTO"),getSession()]).then(([x,t])=>{setItems(x.items||[]);setToken(t||"")}).catch(()=>{})},[]);
 const first=items.at(-1),latest=items[0];
 const source=(x:any)=>({uri:API+"/api/media/"+x.id,headers:{Authorization:"Bearer "+token}});
 const pan=useMemo(()=>PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,onPanResponderGrant:e=>setRatio(Math.max(.05,Math.min(.95,e.nativeEvent.locationX/width))),onPanResponderMove:e=>setRatio(Math.max(.05,Math.min(.95,e.nativeEvent.locationX/width)))}),[width]);
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}><Copy text={"ZURÜCK"}/></Text></Pressable></View>
  <Eyebrow><Copy text={"FORTSCHRITTSBILDER"}/></Eyebrow><Text style={s.title}><Copy text={"VORHER."}/>{"\n"}<Copy text={"NACHHER."}/></Text>
  {first&&latest&&token?<Card><SectionTitle><Copy text={"Direkter Vergleich"}/></SectionTitle><View style={s.compare} onLayout={e=>setWidth(e.nativeEvent.layout.width)} {...pan.panHandlers}>
    <Image source={source(first)} style={StyleSheet.absoluteFillObject} resizeMode="cover"/>
    <View style={[s.reveal,{width:width*ratio}]}><Image source={source(latest)} style={{width,height:"100%"}} resizeMode="cover"/></View>
    <View style={[s.handle,{left:width*ratio-1}]}><View style={s.knob}><Text style={s.knobText}>↔</Text></View></View>
    <View style={s.labels}><Text style={s.label}><LocalizedValue value={new Date(first.createdAt)} format="toLocaleDateString"/></Text><Text style={s.label}><LocalizedValue value={new Date(latest.createdAt)} format="toLocaleDateString"/></Text></View>
  </View><Text style={s.hint}><Copy text={"Mit dem Finger verschieben, um beide Bilder direkt zu vergleichen."}/></Text></Card>:<Card><SectionTitle><Copy text={"Noch nicht genug Bilder."}/></SectionTitle><Text style={s.hint}><Copy text={"Für einen Vergleich brauchst du mindestens zwei Fortschrittsbilder."}/></Text></Card>}
  <Pressable style={s.primary} onPress={()=>router.push("/progress-photo")}><Text style={s.primaryText}><Copy text={"NEUES BILD AUFNEHMEN"}/></Text></Pressable>
  <Card><Eyebrow><Copy text={"VERLAUF"}/></Eyebrow><View style={s.grid}>{items.map(x=><View style={s.item} key={x.id}><Image source={token?source(x):undefined} style={s.thumb}/><Text style={s.date}><LocalizedValue value={new Date(x.createdAt)} format="toLocaleDateString"/></Text></View>)}</View></Card>
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:70,gap:12},top:{height:54,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},back:{color:C.dim,fontSize:9,fontWeight:"900"},title:{color:C.ink,fontSize:48,lineHeight:42,fontWeight:"900",letterSpacing:-3,marginVertical:12},compare:{height:460,borderRadius:radius.lg,overflow:"hidden",backgroundColor:C.panel2,marginTop:12},reveal:{position:"absolute",left:0,top:0,bottom:0,overflow:"hidden"},handle:{position:"absolute",top:0,bottom:0,width:2,backgroundColor:C.volt,alignItems:"center",justifyContent:"center"},knob:{width:38,height:38,borderRadius:19,backgroundColor:C.volt,alignItems:"center",justifyContent:"center"},knobText:{color:C.bg,fontWeight:"900"},labels:{position:"absolute",left:10,right:10,bottom:10,flexDirection:"row",justifyContent:"space-between"},label:{color:C.ink,fontSize:8,fontWeight:"900",backgroundColor:"#050606CC",paddingVertical:5,paddingHorizontal:8,borderRadius:16},hint:{color:C.dim,fontSize:10,lineHeight:17,marginTop:10},primary:{height:52,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center"},primaryText:{color:C.bg,fontSize:9,fontWeight:"900"},grid:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:12},item:{width:"31%"},thumb:{width:"100%",aspectRatio:4/5,borderRadius:12,backgroundColor:C.panel2},date:{color:C.dim,fontSize:7,fontWeight:"900",marginTop:4,textAlign:"center"}});
