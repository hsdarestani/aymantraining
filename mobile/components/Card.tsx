import {StyleSheet,ViewStyle} from "react-native";
import Animated,{FadeIn,FadeInDown,FadeInUp} from "react-native-reanimated";
import {C} from "../theme";

export function Card({children,style}:{children:React.ReactNode;style?:ViewStyle|ViewStyle[]}){
  return <Animated.View entering={FadeIn.duration(180)} style={[s.card,style]}>{children}</Animated.View>;
}
export function Eyebrow({children}:{children:React.ReactNode}){
  return <Animated.Text entering={FadeInUp.duration(360)} style={s.eyebrow}>{children}</Animated.Text>;
}
export function SectionTitle({children}:{children:React.ReactNode}){
  return <Animated.Text entering={FadeInDown.delay(60).duration(420)} style={s.title}>{children}</Animated.Text>;
}
const s=StyleSheet.create({
  card:{
    backgroundColor:C.panel,
    borderTopWidth:1,
    borderBottomWidth:1,
    borderColor:C.line,
    borderRadius:8,
    padding:20,
    overflow:"hidden"
  },
  eyebrow:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:2.2,textTransform:"uppercase"},
  title:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:21,letterSpacing:-.6,marginTop:6}
});
