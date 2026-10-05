import {Tabs} from "expo-router";import {Dumbbell,House,MessageCircle,TrendingUp,UserRound} from "lucide-react-native";import {C} from "../../theme";import {useLocale} from "../../lib/i18n/locale";
const icon=(Icon:any)=>(props:any)=><Icon {...props} size={21} strokeWidth={2}/>;
export default function TabsLayout(){const locale=useLocale();return <Tabs screenOptions={{headerShown:false,tabBarHideOnKeyboard:true,tabBarActiveTintColor:C.bg,tabBarInactiveTintColor:"#747A76",tabBarStyle:{position:"absolute",left:12,right:12,bottom:10,height:72,borderTopWidth:0,borderWidth:1,borderColor:C.line,borderRadius:24,backgroundColor:"#101313F2",paddingTop:8,paddingBottom:8},tabBarItemStyle:{borderRadius:17,marginHorizontal:2},tabBarActiveBackgroundColor:C.volt,tabBarLabelStyle:{fontSize:7,fontWeight:"900",letterSpacing:.5}}}>
<Tabs.Screen name="index" options={{title:locale==="en"?"HOME":"START",tabBarIcon:icon(House)}}/>
<Tabs.Screen name="training" options={{title:"TRAINING",tabBarIcon:icon(Dumbbell)}}/>
<Tabs.Screen name="progress" options={{title:locale==="en"?"PROGRESS":"FORTSCHRITT",tabBarIcon:icon(TrendingUp)}}/>
<Tabs.Screen name="coach" options={{title:locale==="en"?"COACH":"TRAINER",tabBarIcon:icon(MessageCircle)}}/>
<Tabs.Screen name="athlete" options={{title:locale==="en"?"ATHLETE":"ATHLET",tabBarIcon:icon(UserRound)}}/>
</Tabs>}
