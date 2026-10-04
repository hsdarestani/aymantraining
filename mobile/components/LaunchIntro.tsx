import {useEffect} from "react";
import {StyleSheet,Text,View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated,{Easing,useAnimatedStyle,useSharedValue,withDelay,withRepeat,withSequence,withTiming} from "react-native-reanimated";
import {C} from "../theme";

export default function LaunchIntro({onDone}:{onDone:()=>void}){
  const ring=useSharedValue(.72),ringOpacity=useSharedValue(0),score=useSharedValue(0),title=useSharedValue(0),line=useSharedValue(0),pulse=useSharedValue(1);

  useEffect(()=>{
    ringOpacity.value=withTiming(1,{duration:650});
    ring.value=withSequence(withTiming(1.08,{duration:1400,easing:Easing.out(Easing.cubic)}),withTiming(1,{duration:850}));
    pulse.value=withDelay(1500,withRepeat(withSequence(withTiming(1.07,{duration:850}),withTiming(.96,{duration:850})),-1,true));
    score.value=withDelay(950,withTiming(1,{duration:1500,easing:Easing.out(Easing.cubic)}));
    title.value=withDelay(1850,withTiming(1,{duration:900}));
    line.value=withDelay(2700,withTiming(1,{duration:1100}));
    const h1=setTimeout(()=>Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>undefined),900);
    const h2=setTimeout(()=>Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>undefined),3850);
    const done=setTimeout(onDone,5300);
    return()=>{clearTimeout(h1);clearTimeout(h2);clearTimeout(done)};
  },[]);

  const ringStyle=useAnimatedStyle(()=>({opacity:ringOpacity.value,transform:[{scale:ring.value}]}));
  const scoreStyle=useAnimatedStyle(()=>({opacity:score.value,transform:[{translateY:(1-score.value)*18},{scale:.92+.08*score.value}]}));
  const titleStyle=useAnimatedStyle(()=>({opacity:title.value,transform:[{translateY:(1-title.value)*14}]}));
  const lineStyle=useAnimatedStyle(()=>({opacity:line.value,transform:[{scaleX:line.value}]}));
  const pulseStyle=useAnimatedStyle(()=>({transform:[{scale:pulse.value}]}));

  return <View style={s.root}>
    <LinearGradient colors={["#050606","#0B100C","#050606"]} style={StyleSheet.absoluteFill}/>
    <View style={s.grid}/>
    <Animated.View style={[s.orbit,ringStyle]}>
      <Animated.View style={[s.glow,pulseStyle]}/>
      <View style={s.ringOuter}/>
      <View style={s.ringMid}/>
      <View style={s.ringInner}>
        <Animated.View style={scoreStyle}>
          <Text style={s.score}>100</Text>
          <Text style={s.scoreLabel}>LEISTUNG</Text>
        </Animated.View>
      </View>
      <View style={[s.tick,{transform:[{rotate:"24deg"},{translateY:-128}]}]}/>
      <View style={[s.tick,{transform:[{rotate:"106deg"},{translateY:-128}]}]}/>
      <View style={[s.tick,{transform:[{rotate:"198deg"},{translateY:-128}]}]}/>
      <View style={[s.tick,{transform:[{rotate:"286deg"},{translateY:-128}]}]}/>
    </Animated.View>

    <Animated.View style={[s.copy,titleStyle]}>
      <Text style={s.brand}>BE <Text style={s.brandVolt}>DIFFERENT</Text></Text>
      <Text style={s.title}>BAUE DEINEN ATHLETEN.</Text>
      <Animated.View style={[s.line,lineStyle]}/>
      <Text style={s.sub}>Training · Regeneration · Ernährung · Fortschritt</Text>
    </Animated.View>

    <View style={s.footer}><Text style={s.footerText}>DEIN SYSTEM WIRD VORBEREITET</Text><View style={s.dots}><View style={s.dot}/><View style={s.dot}/><View style={s.dot}/></View></View>
  </View>;
}

const s=StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg,alignItems:"center",justifyContent:"center",overflow:"hidden"},
  grid:{...StyleSheet.absoluteFillObject,opacity:.12,backgroundColor:"transparent",borderWidth:1,borderColor:"rgba(215,255,0,.06)"},
  orbit:{width:290,height:290,alignItems:"center",justifyContent:"center",marginTop:-30},
  glow:{position:"absolute",width:220,height:220,borderRadius:110,backgroundColor:"rgba(215,255,0,.08)"},
  ringOuter:{position:"absolute",width:270,height:270,borderRadius:135,borderWidth:1,borderColor:"rgba(215,255,0,.22)"},
  ringMid:{position:"absolute",width:224,height:224,borderRadius:112,borderWidth:2,borderColor:"rgba(215,255,0,.48)",borderTopColor:C.volt,borderRightColor:"rgba(215,255,0,.08)"},
  ringInner:{width:170,height:170,borderRadius:85,borderWidth:1,borderColor:"rgba(255,255,255,.10)",backgroundColor:"rgba(13,15,15,.92)",alignItems:"center",justifyContent:"center"},
  score:{color:C.ink,fontSize:64,lineHeight:64,fontWeight:"900",letterSpacing:-4,textAlign:"center"},
  scoreLabel:{color:C.volt,fontSize:8,fontWeight:"900",letterSpacing:2.4,textAlign:"center",marginTop:4},
  tick:{position:"absolute",width:3,height:18,borderRadius:4,backgroundColor:C.volt,top:126,left:143},
  copy:{alignItems:"center",paddingHorizontal:26,marginTop:22},
  brand:{color:C.ink,fontSize:24,fontWeight:"900",letterSpacing:-1},brandVolt:{color:C.volt},
  title:{color:C.ink,fontSize:27,fontWeight:"900",letterSpacing:-1.3,marginTop:12,textAlign:"center"},
  line:{height:2,width:190,backgroundColor:C.volt,marginVertical:16},
  sub:{color:C.dim,fontSize:10,fontWeight:"800",letterSpacing:.5,textAlign:"center"},
  footer:{position:"absolute",bottom:42,alignItems:"center",gap:10},
  footerText:{color:"#555C58",fontSize:8,fontWeight:"900",letterSpacing:1.7},
  dots:{flexDirection:"row",gap:5},dot:{width:5,height:5,borderRadius:3,backgroundColor:C.volt,opacity:.72}, 
});
