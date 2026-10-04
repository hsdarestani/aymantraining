import {StyleSheet,Text} from "react-native";
import Animated,{FadeIn} from "react-native-reanimated";
import {C} from "../theme";
export default function Brand({compact=false}:{compact?:boolean}){
  return <Animated.View entering={FadeIn.duration(420)} style={s.row}><Text style={[s.text,compact&&s.compact]}>BE </Text><Text style={[s.text,s.volt,compact&&s.compact]}>DIFFERENT</Text></Animated.View>;
}
const s=StyleSheet.create({row:{flexDirection:"row",alignItems:"center"},text:{color:C.ink,fontSize:24,fontWeight:"900",letterSpacing:-1.5},compact:{fontSize:18},volt:{color:C.volt}});
