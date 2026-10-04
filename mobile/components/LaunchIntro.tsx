import {useEffect} from "react";
import {StyleSheet,Text,View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated,{
  Easing,FadeIn,useAnimatedStyle,useSharedValue,withDelay,withRepeat,withSequence,withTiming
} from "react-native-reanimated";
import {C} from "../theme";

export default function LaunchIntro({onDone}:{onDone:()=>void}){
  const ring=useSharedValue(.72);
  const ringOpacity=useSharedValue(0);
  const score=useSharedValue(0);
  const title=useSharedValue(0);
  const line=useSharedValue(0);
  const pulse=useSharedValue(1);
  const spin=useSharedValue(0);
  const meter=useSharedValue(0);

  useEffect(()=>{
    ringOpacity.value=withTiming(1,{duration:650});
    ring.value=withSequence(
      withTiming(1.08,{duration:1350,easing:Easing.out(Easing.cubic)}),
      withTiming(1,{duration:700})
    );
    spin.value=withRepeat(withTiming(1,{duration:2800,easing:Easing.linear}),-1,false);
    pulse.value=withDelay(1250,withRepeat(withSequence(
      withTiming(1.07,{duration:780,easing:Easing.inOut(Easing.sin)}),
      withTiming(.96,{duration:780,easing:Easing.inOut(Easing.sin)})
    ),-1,true));
    score.value=withDelay(850,withTiming(1,{duration:1450,easing:Easing.out(Easing.cubic)}));
    title.value=withDelay(1900,withTiming(1,{duration:850,easing:Easing.out(Easing.cubic)}));
    line.value=withDelay(2550,withTiming(1,{duration:900,easing:Easing.out(Easing.cubic)}));
    meter.value=withDelay(300,withTiming(1,{duration:4800,easing:Easing.inOut(Easing.cubic)}));

    const h1=setTimeout(()=>Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>undefined),900);
    const h2=setTimeout(()=>Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(()=>undefined),2700);
    const h3=setTimeout(()=>Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>undefined),4800);
    const done=setTimeout(onDone,5600);
    return()=>{clearTimeout(h1);clearTimeout(h2);clearTimeout(h3);clearTimeout(done)};
  },[]);

  const ringStyle=useAnimatedStyle(()=>({opacity:ringOpacity.value,transform:[{scale:ring.value}]}));
  const scoreStyle=useAnimatedStyle(()=>({opacity:score.value,transform:[{translateY:(1-score.value)*18},{scale:.92+.08*score.value}]}));
  const titleStyle=useAnimatedStyle(()=>({opacity:title.value,transform:[{translateY:(1-title.value)*14}]}));
  const lineStyle=useAnimatedStyle(()=>({opacity:line.value,transform:[{scaleX:line.value}]}));
  const pulseStyle=useAnimatedStyle(()=>({transform:[{scale:pulse.value}]}));
  const spinStyle=useAnimatedStyle(()=>({transform:[{rotate:(spin.value*360)+"deg"}]}));
  const meterStyle=useAnimatedStyle(()=>({transform:[{scaleX:meter.value}]}));

  return <View style={s.root}>
    <LinearGradient colors={["#050606","#0B100C","#050606"]} style={StyleSheet.absoluteFill}/>
    <View style={s.grid}/>

    <Animated.View entering={FadeIn.duration(500)} style={[s.orbit,ringStyle]}>
      <Animated.View style={[s.glow,pulseStyle]}/>
      <Animated.View style={[s.spinRing,spinStyle]}>
        <View style={[s.segment,{top:3,left:132}]}/>
        <View style={[s.segment,{right:20,top:71,transform:[{rotate:"58deg"}]}]}/>
        <View style={[s.segment,{right:24,bottom:64,transform:[{rotate:"126deg"}]}]}/>
        <View style={[s.segment,{bottom:10,left:88,transform:[{rotate:"205deg"}]}]}/>
        <View style={[s.segment,{left:18,top:91,transform:[{rotate:"285deg"}]}]}/>
      </Animated.View>
      <View style={s.ringOuter}/>
      <View style={s.ringMid}/>
      <View style={s.ringInner}>
        <Animated.View style={scoreStyle}>
          <Text style={s.score}>100</Text>
          <Text style={s.scoreLabel}>LEISTUNGSWERT</Text>
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

    <View style={s.footer}>
      <Text style={s.footerText}>DEIN SYSTEM WIRD VORBEREITET</Text>
      <View style={s.meter}><Animated.View style={[s.meterFill,meterStyle]}/></View>
    </View>
  </View>;
}

const s=StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg,alignItems:"center",justifyContent:"center",overflow:"hidden"},
  grid:{...StyleSheet.absoluteFillObject,opacity:.12,backgroundColor:"transparent",borderWidth:1,borderColor:"rgba(215,255,0,.06)"},
  orbit:{width:300,height:300,alignItems:"center",justifyContent:"center",marginTop:-34},
  glow:{position:"absolute",width:230,height:230,borderRadius:115,backgroundColor:"rgba(215,255,0,.08)"},
  spinRing:{position:"absolute",width:286,height:286,borderRadius:143},
  segment:{position:"absolute",width:18,height:4,borderRadius:4,backgroundColor:C.volt,shadowColor:C.volt,shadowOpacity:.7,shadowRadius:8},
  ringOuter:{position:"absolute",width:278,height:278,borderRadius:139,borderWidth:1,borderColor:"rgba(215,255,0,.20)"},
  ringMid:{position:"absolute",width:228,height:228,borderRadius:114,borderWidth:2,borderColor:"rgba(215,255,0,.46)",borderTopColor:C.volt,borderRightColor:"rgba(215,255,0,.08)"},
  ringInner:{width:172,height:172,borderRadius:86,borderWidth:1,borderColor:"rgba(255,255,255,.10)",backgroundColor:"rgba(13,15,15,.94)",alignItems:"center",justifyContent:"center"},
  score:{color:C.ink,fontSize:64,lineHeight:64,fontWeight:"900",letterSpacing:-4,textAlign:"center"},
  scoreLabel:{color:C.volt,fontSize:8,fontWeight:"900",letterSpacing:2.2,textAlign:"center",marginTop:4},
  tick:{position:"absolute",width:3,height:18,borderRadius:4,backgroundColor:C.volt,top:131,left:148},
  copy:{alignItems:"center",paddingHorizontal:26,marginTop:24},
  brand:{color:C.ink,fontSize:24,fontWeight:"900",letterSpacing:-1},brandVolt:{color:C.volt},
  title:{color:C.ink,fontSize:27,fontWeight:"900",letterSpacing:-1.3,marginTop:12,textAlign:"center"},
  line:{height:2,width:190,backgroundColor:C.volt,marginVertical:16},
  sub:{color:C.dim,fontSize:10,fontWeight:"800",letterSpacing:.5,textAlign:"center"},
  footer:{position:"absolute",left:38,right:38,bottom:40,alignItems:"center",gap:12},
  footerText:{color:"#666D69",fontSize:8,fontWeight:"900",letterSpacing:1.7},
  meter:{width:"100%",height:3,borderRadius:3,overflow:"hidden",backgroundColor:"rgba(255,255,255,.08)"},
  meterFill:{width:"100%",height:"100%",backgroundColor:C.volt,transformOrigin:"left"}
});
