import {StyleSheet,View} from "react-native";
import Animated,{FadeIn,FadeInDown} from "react-native-reanimated";
import Brand from "./Brand";
import {C} from "../theme";

export default function Screen({children,scroll=true}:{children:React.ReactNode;scroll?:boolean}){
  const content=<Animated.View entering={FadeInDown.duration(420)} style={s.inner}><View style={s.header}><Brand compact/></View>{children}</Animated.View>;
  return <View style={s.safe}>{scroll?<Animated.ScrollView entering={FadeIn.duration(300)} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>{content}</Animated.ScrollView>:<View style={s.content}>{content}</View>}</View>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{paddingHorizontal:16,paddingTop:4,paddingBottom:120},inner:{gap:12},header:{height:56,justifyContent:"center"}});
