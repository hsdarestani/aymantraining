import {useEffect} from "react";
import {AccessibilityInfo,StyleSheet,Text,View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import Svg,{Defs,RadialGradient,Rect,Stop} from "react-native-svg";
import Animated,{
  cancelAnimation,Easing,Extrapolation,FadeIn,interpolate,runOnJS,
  useAnimatedStyle,useSharedValue,withRepeat,withTiming,
  type SharedValue
} from "react-native-reanimated";
import Brand from "./Brand";
import {C} from "../theme";

const SEGMENTS=7;
const SEGMENT_WIDTH=26;

/** Each bar fills smoothly, left to right, instead of switching abruptly. */
function ProgressSegment({index,progress}:{index:number;progress:SharedValue<number>}){
  const fill=useAnimatedStyle(()=>({
    width:interpolate(progress.value,
      [index/SEGMENTS,(index+1)/SEGMENTS],
      [0,SEGMENT_WIDTH],Extrapolation.CLAMP)
  }));
  return <View style={styles.segment}>
    <Animated.View style={[styles.segmentFill,fill]}/>
  </View>;
}

/** SVG radial falloff keeps the ambient light soft without bitmap assets. */
function Halo({secondary=false}:{secondary?:boolean}){
  const id=secondary?"launch-amber":"launch-lime";
  return <Svg width="100%" height="100%" viewBox="0 0 360 360">
    <Defs>
      <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
        <Stop offset="0%" stopColor={secondary?"#A6DB3F":"#B7FF22"} stopOpacity={secondary?0.20:0.28}/>
        <Stop offset="33%" stopColor={secondary?"#6E9028":"#5D9D20"} stopOpacity={secondary?0.10:0.12}/>
        <Stop offset="73%" stopColor="#1C4C24" stopOpacity={0.025}/>
        <Stop offset="100%" stopColor="#050606" stopOpacity={0}/>
      </RadialGradient>
    </Defs>
    <Rect width="360" height="360" fill={`url(#${id})`}/>
  </Svg>;
}

export default function LaunchIntro({onDone}:{onDone:()=>void}){
  const progress=useSharedValue(0);
  const ambience=useSharedValue(0);
  const breath=useSharedValue(0);

  useEffect(()=>{
    let active=true;
    let hold:ReturnType<typeof setTimeout>|undefined;
    const finish=()=>{
      if(active)hold=setTimeout(()=>{if(active)onDone();},280);
    };
    AccessibilityInfo.isReduceMotionEnabled().catch(()=>false).then(reduced=>{
      if(!active)return;
      if(!reduced){
        ambience.value=withRepeat(withTiming(1,{duration:3500,easing:Easing.inOut(Easing.sin)}),-1,true);
        breath.value=withRepeat(withTiming(1,{duration:2100,easing:Easing.inOut(Easing.sin)}),-1,true);
      }
      // Native splash has already completed. This animates the transition into the app.
      progress.value=withTiming(1,{
        duration:reduced?320:2350,
        easing:Easing.inOut(Easing.cubic)
      },done=>{if(done)runOnJS(finish)();});
    });
    return ()=>{
      active=false;
      if(hold)clearTimeout(hold);
      cancelAnimation(progress);
      cancelAnimation(ambience);
      cancelAnimation(breath);
    };
  },[onDone,progress,ambience,breath]);

  const haloOne=useAnimatedStyle(()=>({
    opacity:interpolate(ambience.value,[0,1],[0.72,1]),
    transform:[
      {translateX:interpolate(ambience.value,[0,1],[-24,21])},
      {translateY:interpolate(ambience.value,[0,1],[15,-18])},
      {scale:interpolate(ambience.value,[0,1],[0.94,1.10])}
    ]
  }));
  const haloTwo=useAnimatedStyle(()=>({
    opacity:interpolate(ambience.value,[0,1],[0.75,0.45]),
    transform:[
      {translateX:interpolate(ambience.value,[0,1],[16,-20])},
      {translateY:interpolate(ambience.value,[0,1],[-20,17])},
      {scale:interpolate(ambience.value,[0,1],[1.06,0.94])}
    ]
  }));
  const wordmarkMotion=useAnimatedStyle(()=>({
    transform:[{scale:interpolate(breath.value,[0,1],[1,1.018])}]
  }));
  const accentMotion=useAnimatedStyle(()=>({
    opacity:interpolate(breath.value,[0,1],[0.28,0.55]),
    transform:[{scale:interpolate(breath.value,[0,1],[0.94,1.05])}]
  }));

  return <View style={styles.safe} accessibilityLabel="BE DIFFERENT startet">
    <LinearGradient
      colors={["#050606","#0A100B","#060807","#050606"]}
      locations={[0,0.4,0.74,1]}
      style={StyleSheet.absoluteFillObject}
    />
    <Animated.View pointerEvents="none" style={[styles.halo,styles.haloTop,haloOne]}>
      <Halo/>
    </Animated.View>
    <Animated.View pointerEvents="none" style={[styles.halo,styles.haloBottom,haloTwo]}>
      <Halo secondary/>
    </Animated.View>
    <Animated.View pointerEvents="none" style={[styles.orbit,accentMotion]}/>
    <Animated.View entering={FadeIn.duration(460)} style={styles.center}>
      <Animated.View style={wordmarkMotion}><Brand/></Animated.View>
      <View style={styles.track} accessibilityLabel="Startfortschritt">
        {Array.from({length:SEGMENTS},(_,i)=><ProgressSegment key={i} index={i} progress={progress}/>)}
      </View>
      <Text style={styles.caption}>DEIN SYSTEM STARTET</Text>
    </Animated.View>
  </View>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg,alignItems:"center",justifyContent:"center",overflow:"hidden"},
  halo:{position:"absolute",width:440,height:440},
  haloTop:{top:"2%",left:"-33%"},
  haloBottom:{bottom:"0%",right:"-35%"},
  orbit:{
    position:"absolute",width:325,height:325,borderRadius:180,
    borderWidth:1,borderColor:"rgba(191,255,47,0.14)",
    transform:[{rotate:"-24deg"}]
  },
  center:{alignItems:"center",zIndex:1,paddingHorizontal:20},
  track:{flexDirection:"row",gap:6,marginTop:38,alignItems:"center"},
  segment:{
    width:SEGMENT_WIDTH,height:6,backgroundColor:"#283128",
    overflow:"hidden",transform:[{skewX:"-18deg"}],borderRadius:1
  },
  segmentFill:{
    width:0,height:6,backgroundColor:C.volt,
    shadowColor:C.volt,shadowOpacity:0.75,shadowRadius:6
  },
  caption:{color:"#9AA49C",fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:2.7,marginTop:21}
});
