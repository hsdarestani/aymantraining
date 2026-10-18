import {Tabs} from "expo-router";
import {Platform} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Dumbbell,House,MessageCircle,TrendingUp,UserRound} from "lucide-react-native";
import {C} from "../../theme";
import {useLocale} from "../../lib/i18n/locale";
const icon=(Icon:any)=>(props:any)=><Icon {...props} size={21} strokeWidth={2}/>;
export default function TabsLayout(){
 const locale=useLocale();
 const insets=useSafeAreaInsets();
 // Android 15/16 can draw 3-button navigation over the app. Keep our floating
 // controls above the actual safe area, with a fallback for devices returning 0.
 const bottomClearance=Platform.OS==="android"?Math.max(insets.bottom,32):Math.max(insets.bottom,12);
 return <Tabs screenOptions={{
  headerShown:false,tabBarHideOnKeyboard:true,tabBarActiveTintColor:C.volt,tabBarInactiveTintColor:C.dim,
  tabBarStyle:{position:"absolute",left:10,right:10,bottom:bottomClearance+10,height:70,borderTopWidth:0,borderWidth:1,borderColor:C.line,borderRadius:22,backgroundColor:"#0F1412",paddingTop:9,paddingBottom:8,elevation:10,shadowColor:"#000",shadowOpacity:.4,shadowRadius:14,shadowOffset:{width:0,height:6}},
  tabBarItemStyle:{borderRadius:16,marginHorizontal:1},
  tabBarActiveBackgroundColor:"#27331A",
  tabBarLabelStyle:{fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:.45}
 }}>
  <Tabs.Screen name="index" options={{title:locale==="en"?"HOME":"START",tabBarIcon:icon(House)}}/>
  <Tabs.Screen name="training" options={{title:"TRAINING",tabBarIcon:icon(Dumbbell)}}/>
  <Tabs.Screen name="progress" options={{title:locale==="en"?"PROGRESS":"SCORE",tabBarIcon:icon(TrendingUp)}}/>
  <Tabs.Screen name="coach" options={{title:"COACH",tabBarIcon:icon(MessageCircle)}}/>
  <Tabs.Screen name="athlete" options={{title:locale==="en"?"ATHLETE":"ATHLET",tabBarIcon:icon(UserRound)}}/>
 </Tabs>
}
