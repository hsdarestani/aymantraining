import {StyleSheet,Text,View} from "react-native";
import Animated,{FadeIn} from "react-native-reanimated";
import {C} from "../theme";

export default function Brand({compact=false}:{compact?:boolean}){
  return <Animated.View entering={FadeIn.duration(420)} style={s.row}>
    <View>
      <Text style={[s.wordmark,compact&&s.wordmarkCompact]}>BE DIFFERENT</Text>
      {!compact?<Text style={s.sub}>ATHLETE SYSTEM</Text>:null}
    </View>
  </Animated.View>;
}
const s=StyleSheet.create({
  row:{flexDirection:"row",alignItems:"center"},
  wordmark:{color:C.ink,fontFamily:"Archivo",fontSize:25,letterSpacing:-1.2},
  wordmarkCompact:{fontSize:19,letterSpacing:-.9},
  sub:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:2.4,marginTop:1}
});
