import {StyleSheet,ViewStyle} from "react-native";
import Animated,{FadeInDown,FadeInUp} from "react-native-reanimated";
import {C,radius} from "../theme";

export function Card({children,style}:{children:React.ReactNode;style?:ViewStyle|ViewStyle[]}){
  return <Animated.View entering={FadeInDown.duration(520).springify().damping(18)} style={[s.card,style]}>{children}</Animated.View>;
}
export function Eyebrow({children}:{children:React.ReactNode}){
  return <Animated.Text entering={FadeInUp.duration(360)} style={s.eyebrow}>{children}</Animated.Text>;
}
export function SectionTitle({children}:{children:React.ReactNode}){
  return <Animated.Text entering={FadeInDown.delay(60).duration(420)} style={s.title}>{children}</Animated.Text>;
}
const s=StyleSheet.create({
  card:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:radius.lg,padding:18,overflow:"hidden"},
  eyebrow:{color:C.dim,fontSize:9,fontWeight:"900",letterSpacing:2},
  title:{color:C.ink,fontSize:24,fontWeight:"900",letterSpacing:-1,marginTop:6}
});
