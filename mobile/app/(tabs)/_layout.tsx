import {Tabs} from "expo-router";
import {Dumbbell,House,MessageCircle,TrendingUp,UserRound} from "lucide-react-native";
import {C} from "../../theme";
import {useLocale} from "../../lib/i18n/locale";
const icon=(Icon:any)=>(props:any)=><Icon {...props} size={21} strokeWidth={2}/>;
export default function TabsLayout(){
 const locale=useLocale();
 return <Tabs screenOptions={{
  headerShown:false,tabBarHideOnKeyboard:true,tabBarActiveTintColor:C.ink,tabBarInactiveTintColor:C.dim,
  tabBarStyle:{position:"absolute",left:10,right:10,bottom:8,height:68,borderTopWidth:0,borderWidth:1,borderColor:C.line,borderRadius:22,backgroundColor:"#0F1214F7",paddingTop:7,paddingBottom:7},
  tabBarItemStyle:{borderRadius:16,marginHorizontal:1},
  tabBarActiveBackgroundColor:"#2A1115",
  tabBarLabelStyle:{fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:.45}
 }}>
  <Tabs.Screen name="index" options={{title:locale==="en"?"HOME":"START",tabBarIcon:icon(House)}}/>
  <Tabs.Screen name="training" options={{title:"TRAINING",tabBarIcon:icon(Dumbbell)}}/>
  <Tabs.Screen name="progress" options={{title:locale==="en"?"PROGRESS":"SCORE",tabBarIcon:icon(TrendingUp)}}/>
  <Tabs.Screen name="coach" options={{title:"COACH",tabBarIcon:icon(MessageCircle)}}/>
  <Tabs.Screen name="athlete" options={{title:locale==="en"?"ATHLETE":"ATHLET",tabBarIcon:icon(UserRound)}}/>
 </Tabs>
}
