import {Platform,StyleSheet,View} from "react-native";
import Animated,{FadeIn,FadeInDown} from "react-native-reanimated";
import Brand from "./Brand";
import {C} from "../theme";
import {SafeAreaView,useSafeAreaInsets} from "react-native-safe-area-context";

export default function Screen({children,scroll=true}:{children:React.ReactNode;scroll?:boolean}){
  const insets=useSafeAreaInsets();
  const bottomClearance=Platform.OS==="android"?Math.max(insets.bottom,32):insets.bottom;
  const content=<Animated.View entering={FadeIn.duration(180)} style={s.inner}><View style={s.header}><Brand compact/></View>{children}</Animated.View>;
  return <SafeAreaView edges={["top"]} style={s.safe}>{scroll?<Animated.ScrollView entering={FadeIn.duration(300)} contentContainerStyle={[s.content,{paddingBottom:122+bottomClearance}]} showsVerticalScrollIndicator={false}>{content}</Animated.ScrollView>:<View style={[s.content,{paddingBottom:122+bottomClearance}]}>{content}</View>}</SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{paddingHorizontal:20,paddingTop:4,paddingBottom:120},inner:{gap:18},header:{height:56,justifyContent:"center"}});
