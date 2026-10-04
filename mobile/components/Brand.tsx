import {Image,StyleSheet} from "react-native";
import Animated,{FadeIn} from "react-native-reanimated";

export default function Brand({compact=false}:{compact?:boolean}){
  return <Animated.View entering={FadeIn.duration(420)} style={s.row}>
    <Image source={require("../assets/green-logo.png")} resizeMode="contain" style={compact?s.compact:s.logo}/>
  </Animated.View>;
}
const s=StyleSheet.create({
  row:{flexDirection:"row",alignItems:"center"},
  logo:{width:166,height:58},
  compact:{width:132,height:46}
});
