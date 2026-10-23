import {useEffect,useRef} from "react";
import {AccessibilityInfo,Animated,Easing,StyleSheet,Text,View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import Svg,{Defs,RadialGradient,Rect,Stop} from "react-native-svg";
import {C} from "../theme";
import {Copy} from "./Locale";
import {useLocale} from "../lib/i18n/locale";

const SEGMENTS=7;
const SEGMENT_WIDTH=26;

function ProgressSegment({index,progress}:{index:number;progress:Animated.Value}){
  // Animate only native-driver transforms. Changing width on a detached
  // Fabric view can race with the launcher being removed.
  const amount=progress.interpolate({
    inputRange:[index/SEGMENTS,(index+1)/SEGMENTS],
    outputRange:[0,1],
    extrapolate:"clamp"
  });
  return <View style={styles.segment}>
    <Animated.View style={[styles.segmentFill,{
      transform:[
        {translateX:amount.interpolate({inputRange:[0,1],outputRange:[-SEGMENT_WIDTH/2,0]})},
        {scaleX:amount}
      ]
    }]}/>
  </View>;
}

function Halo({secondary=false}:{secondary?:boolean}){
  const id=secondary?"launch-secondary":"launch-main";
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
  const locale=useLocale();
  const progress=useRef(new Animated.Value(0)).current;
  const glow=useRef(new Animated.Value(0)).current;
  const breath=useRef(new Animated.Value(0)).current;
  const opacity=useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    let active=true;
    const animations:Animated.CompositeAnimation[]=[];
    AccessibilityInfo.isReduceMotionEnabled().catch(()=>true).then(reduced=>{
      if(!active)return;
      if(!reduced){
        const ambientLoop=Animated.loop(Animated.sequence([
          Animated.timing(glow,{toValue:1,duration:3200,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
          Animated.timing(glow,{toValue:0,duration:3200,easing:Easing.inOut(Easing.sin),useNativeDriver:true})
        ]));
        const breathLoop=Animated.loop(Animated.sequence([
          Animated.timing(breath,{toValue:1,duration:1900,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
          Animated.timing(breath,{toValue:0,duration:1900,easing:Easing.inOut(Easing.sin),useNativeDriver:true})
        ]));
        animations.push(ambientLoop,breathLoop);
        ambientLoop.start();
        breathLoop.start();
      }
      const fadeIn=Animated.timing(opacity,{
        toValue:1,duration:reduced?120:350,useNativeDriver:true
      });
      const filling=Animated.timing(progress,{
        toValue:1,duration:reduced?320:2200,
        easing:Easing.inOut(Easing.cubic),useNativeDriver:true
      });
      animations.push(fadeIn,filling);
      fadeIn.start();
      filling.start(({finished})=>{
        if(!active||!finished)return;
        // Stop all continuous property updates before unmounting the overlay.
        for(const animation of animations)animation.stop();
        const fadeOut=Animated.timing(opacity,{
          toValue:0,duration:reduced?90:280,useNativeDriver:true
        });
        animations.push(fadeOut);
        fadeOut.start(({finished:done})=>{if(active&&done)onDone()});
      });
    });
    return()=>{
      active=false;
      for(const animation of animations)animation.stop();
      progress.stopAnimation();
      glow.stopAnimation();
      breath.stopAnimation();
      opacity.stopAnimation();
    };
  },[onDone,progress,glow,breath,opacity]);

  return <View style={styles.safe} accessibilityLabel={locale==="en"?"BE DIFFERENT is starting":"BE DIFFERENT startet"}>
    <LinearGradient colors={["#050606","#0A100B","#060807","#050606"]}
      locations={[0,0.4,0.74,1]} style={StyleSheet.absoluteFillObject}/>
    <Animated.View pointerEvents="none" style={[styles.halo,styles.haloTop,{
      opacity:glow.interpolate({inputRange:[0,1],outputRange:[0.68,0.98]}),
      transform:[{translateX:glow.interpolate({inputRange:[0,1],outputRange:[-18,20]})},
        {scale:glow.interpolate({inputRange:[0,1],outputRange:[0.95,1.07]})}]
    }]}><Halo/></Animated.View>
    <Animated.View pointerEvents="none" style={[styles.halo,styles.haloBottom,{
      opacity:glow.interpolate({inputRange:[0,1],outputRange:[0.70,0.42]}),
      transform:[{translateX:glow.interpolate({inputRange:[0,1],outputRange:[17,-18]})},
        {scale:glow.interpolate({inputRange:[0,1],outputRange:[1.06,0.94]})}]
    }]}><Halo secondary/></Animated.View>
    <Animated.View pointerEvents="none" style={[styles.orbit,{
      opacity:breath.interpolate({inputRange:[0,1],outputRange:[0.24,0.5]})
    }]}/>
    <Animated.View style={[styles.center,{opacity}]}>
      <Animated.View style={{
        transform:[{scale:breath.interpolate({inputRange:[0,1],outputRange:[1,1.018]})}]
      }}>
        <Text style={styles.wordmark}>BE DIFFERENT</Text>
        <Text style={styles.subtitle}><Copy text="ATHLETEN SYSTEM"/></Text>
      </Animated.View>
      <View style={styles.track} accessibilityLabel={locale==="en"?"Launch progress":"Startfortschritt"}>
        {Array.from({length:SEGMENTS},(_,i)=><ProgressSegment key={i} index={i} progress={progress}/>)}
      </View>
      <Text style={styles.caption}><Copy text="DEIN SYSTEM STARTET"/></Text>
    </Animated.View>
  </View>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg,alignItems:"center",justifyContent:"center",overflow:"hidden"},
  halo:{position:"absolute",width:440,height:440},
  haloTop:{top:"2%",left:"-33%"},
  haloBottom:{bottom:"0%",right:"-35%"},
  orbit:{position:"absolute",width:325,height:325,borderRadius:180,borderWidth:1,
    borderColor:"rgba(191,255,47,0.14)"},
  center:{alignItems:"center",zIndex:1,paddingHorizontal:20},
  wordmark:{color:C.ink,fontFamily:"Archivo",fontSize:25,letterSpacing:-1.2},
  subtitle:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:2.4,marginTop:1},
  track:{flexDirection:"row",gap:6,marginTop:38,alignItems:"center"},
  segment:{width:SEGMENT_WIDTH,height:6,backgroundColor:"#283128",overflow:"hidden",
    transform:[{skewX:"-18deg"}],borderRadius:1},
  segmentFill:{width:SEGMENT_WIDTH,height:6,backgroundColor:C.volt},
  caption:{color:"#9AA49C",fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:2.7,marginTop:21}
});
