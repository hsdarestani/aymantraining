import {useEffect} from "react";
import {AccessibilityInfo,StyleSheet,Text,View} from "react-native";
import Animated,{FadeIn} from "react-native-reanimated";
import Brand from "./Brand";
import {C} from "../theme";

export default function LaunchIntro({onDone}:{onDone:()=>void}){
 useEffect(()=>{let timer:ReturnType<typeof setTimeout>;let active=true;AccessibilityInfo.isReduceMotionEnabled().catch(()=>true).then(reduced=>{if(active)timer=setTimeout(onDone,reduced?100:1000)});return()=>{active=false;clearTimeout(timer)}},[onDone]);
 return <View style={s.safe}><Animated.View entering={FadeIn.duration(180)} style={s.center}><Brand/><View style={s.track}>{Array.from({length:7},(_,i)=><View key={i} style={[s.segment,i<5&&s.on]}/>)}</View><Text style={s.caption}>BE DIFFERENT</Text></Animated.View></View>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg,alignItems:"center",justifyContent:"center"},center:{alignItems:"center"},track:{flexDirection:"row",gap:5,marginTop:32},segment:{width:24,height:5,backgroundColor:C.line,transform:[{skewX:"-20deg"}]},on:{backgroundColor:C.volt},caption:{color:C.dim,fontFamily:"Manrope",fontSize:11,letterSpacing:2,marginTop:16}});
