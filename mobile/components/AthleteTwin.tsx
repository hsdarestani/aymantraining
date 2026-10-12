import {useEffect,useRef} from "react";
import {Animated,StyleSheet,View} from "react-native";
import Svg,{Circle,Defs,Ellipse,LinearGradient,Path,Stop} from "react-native-svg";
import {C} from "../theme";

/**
 * Animated, deliberately generic avatar. This is an illustration, not a body
 * scan or a representation of someone's measurements. Body metrics remain
 * exclusively in the measured score and body-data surfaces.
 */
export default function AthleteTwin({compact=false}:{compact?:boolean}){
 const pulse=useRef(new Animated.Value(.45)).current;
 const scan=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  const p=Animated.loop(Animated.sequence([
   Animated.timing(pulse,{toValue:1,duration:1800,useNativeDriver:true}),
   Animated.timing(pulse,{toValue:.45,duration:1800,useNativeDriver:true})
  ]));
  const s=Animated.loop(Animated.sequence([
   Animated.timing(scan,{toValue:1,duration:3000,useNativeDriver:true}),
   Animated.timing(scan,{toValue:0,duration:3000,useNativeDriver:true})
  ]));
  p.start();s.start();return()=>{p.stop();s.stop()};
 },[pulse,scan]);
 return <View accessible accessibilityLabel="Animierte schematische Athletenfigur, keine Körpermessung" style={[styles.root,compact&&styles.compact]}>
  <Animated.View style={[styles.aura,{opacity:pulse}]}/>
  <Svg width="100%" height="100%" viewBox="0 0 260 340">
   <Defs>
    <LinearGradient id="twinEdge" x1="0" y1="0" x2="1" y2="1">
     <Stop offset="0" stopColor="#EAFF9D"/><Stop offset=".48" stopColor={C.volt}/><Stop offset="1" stopColor="#436324"/>
    </LinearGradient>
    <LinearGradient id="twinBody" x1="0" y1="0" x2="1" y2="1">
     <Stop offset="0" stopColor="#385235" stopOpacity=".42"/><Stop offset="1" stopColor="#101917" stopOpacity=".08"/>
    </LinearGradient>
   </Defs>
   <Ellipse cx="130" cy="168" rx="82" ry="140" fill="none" stroke="#D4FF0025" strokeWidth="1" strokeDasharray="3 9"/>
   <Ellipse cx="130" cy="168" rx="107" ry="164" fill="none" stroke="#D4FF0014" strokeWidth="1"/>
   <Path d="M130 28C103 28 89 47 91 75C92 97 108 110 130 110C152 110 168 97 169 75C171 47 157 28 130 28Z" stroke="url(#twinEdge)" fill="url(#twinBody)" strokeWidth="2"/>
   <Path d="M94 105C70 111 62 127 56 151L36 217C33 230 39 238 49 236C58 234 62 222 65 213L83 166L85 206L93 238L99 300C100 317 108 325 119 321C126 319 130 311 129 301L129 244L134 244L137 301C137 314 145 322 155 321C165 320 169 310 168 299L167 240L175 206L176 166L194 213C197 225 201 234 211 236C221 238 227 230 224 217L204 151C198 127 190 111 166 105L151 117C140 123 120 123 109 117Z" stroke="url(#twinEdge)" fill="url(#twinBody)" strokeWidth="2" strokeLinejoin="round"/>
   <Path d="M130 112V237M85 164L175 164M90 202L170 202M110 119L100 199M150 119L160 199" stroke="#D4FF0040" strokeWidth="1.3"/>
   <Path d="M97 60Q130 76 163 60M104 88Q130 101 156 88M99 147Q130 160 161 147" stroke="#EDFFB030" strokeWidth="1"/>
   <Circle cx="130" cy="165" r="17" fill="#D4FF0012" stroke="#D4FF0066"/>
   <Circle cx="130" cy="165" r="4" fill={C.volt}/>
   <Circle cx="86" cy="165" r="3" fill={C.volt}/><Circle cx="174" cy="165" r="3" fill={C.volt}/>
   <Circle cx="129" cy="245" r="3" fill={C.volt}/>
  </Svg>
  <Animated.View style={[styles.scan,{transform:[{translateY:scan.interpolate({inputRange:[0,1],outputRange:[-106,112]})}]}]}/>
  <View style={styles.cornerTop}/><View style={styles.cornerBottom}/>
 </View>;
}
const styles=StyleSheet.create({
 root:{width:240,height:320,position:"relative",justifyContent:"center",alignItems:"center",overflow:"hidden"},
 compact:{width:156,height:232},
 aura:{position:"absolute",width:"75%",height:"70%",borderRadius:100,backgroundColor:"#3A5B20",transform:[{scaleX:.62}]},
 scan:{position:"absolute",top:"50%",left:"16%",width:"68%",height:1,backgroundColor:"#D4FF0088",shadowColor:C.volt,shadowOpacity:.6,shadowRadius:10,elevation:3},
 cornerTop:{position:"absolute",top:18,left:14,width:18,height:18,borderTopWidth:1,borderLeftWidth:1,borderColor:"#D4FF0066"},
 cornerBottom:{position:"absolute",bottom:18,right:14,width:18,height:18,borderBottomWidth:1,borderRightWidth:1,borderColor:"#D4FF0066"}
});
