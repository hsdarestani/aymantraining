import {useCallback,useEffect,useRef,useState} from "react";
import {AccessibilityInfo,Animated,Easing,Modal,Pressable,StyleSheet,Text,View} from "react-native";
import {useFocusEffect} from "expo-router";
import {api} from "../lib/api";
import {C} from "../theme";
import {Copy} from "./Locale";
type Award={id:string;title:string;message:string;intensity:"SMALL"|"MEDIUM"|"FULL"};
type Setting={enabled:boolean;reduceMotion:boolean};
type Response={enabled:boolean;preference:Setting;pending:Award[]};
export default function MilestoneCelebration(){
 const [queue,setQueue]=useState<Award[]>([]),[prefs,setPrefs]=useState<Setting>({enabled:true,reduceMotion:false});
 const [systemReduce,setSystemReduce]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const value=useRef(new Animated.Value(1)).current;
 const load=useCallback(()=>{
  let active=true;
  api<Response>("/api/celebrations").then(result=>{
   if(active&&result.enabled){setPrefs(result.preference);setQueue(result.pending)}
  }).catch(()=>{});
  return()=>{active=false;setQueue([]);setError("")};
 },[]);
 useFocusEffect(load);
 useEffect(()=>{
  let active=true;
  void AccessibilityInfo.isReduceMotionEnabled().then(reduce=>{if(active)setSystemReduce(reduce)}).catch(()=>{});
  const sub=AccessibilityInfo.addEventListener("reduceMotionChanged",setSystemReduce);
  return()=>{active=false;sub.remove()};
 },[]);
 const award=prefs.enabled?queue[0]:undefined;
 const still=systemReduce||prefs.reduceMotion;
 useEffect(()=>{
  value.stopAnimation();
  if(!award)return;
  value.setValue(still?1:0);
  if(still)return;
  Animated.timing(value,{toValue:1,duration:award.intensity==="FULL"?1050:award.intensity==="MEDIUM"?710:430,
   easing:Easing.out(Easing.back(1.15)),useNativeDriver:true}).start();
  return()=>value.stopAnimation();
 },[award?.id,still,value]);
 async function acknowledge(){
  if(!award||busy)return;
  setBusy(true);setError("");
  try{
   await api("/api/celebrations",{method:"POST",body:JSON.stringify({action:"ACKNOWLEDGE",awardId:award.id})});
   setQueue(previous=>previous.filter(x=>x.id!==award.id));
  }catch{setError("Bestätigung derzeit nicht möglich. Bitte erneut versuchen.")}
  finally{setBusy(false)}
 }
 async function reduce(){
  if(busy)return;
  setBusy(true);setError("");
  try{
   await api("/api/celebrations",{method:"POST",body:JSON.stringify({
    action:"SET_PREFERENCES",enabled:true,reduceMotion:true})});
   setPrefs(previous=>({...previous,reduceMotion:true}));
  }catch{setError("Die Einstellung konnte nicht gespeichert werden.")}
  finally{setBusy(false)}
 }
 const strength=award?.intensity==="FULL"?10:award?.intensity==="MEDIUM"?5:0;
 return <Modal visible={Boolean(award)} transparent animationType="none" onRequestClose={()=>void acknowledge()}
  statusBarTranslucent>
  <View style={s.shade}>
   <View style={s.dialog} accessibilityViewIsModal accessible accessibilityLabel={award?.title||"Erfolg"}>
    <View style={s.visual} accessible={false} importantForAccessibility="no-hide-descendants">
     <View style={[s.ring,award?.intensity==="FULL"&&s.ringFull]}/>
     <Animated.Text style={[s.star,{opacity:value,transform:[{
      scale:value.interpolate({inputRange:[0,1],outputRange:[.6,1]})
     }]}]}>✦</Animated.Text>
     {Array.from({length:strength},(_,i)=><View key={i} style={[s.piece,{
      transform:[{rotate:(i*(360/Math.max(1,strength)))+"deg"},{translateY:award?.intensity==="FULL"?-87:-75}]
     }]}/>)}
    </View>
    <Text style={s.kicker}><Copy text={award?.intensity==="FULL"?"EIN GROSSER MOMENT":award?.intensity==="MEDIUM"?"DU HAST ES GESCHAFFT":"EIN ECHTER SCHRITT"}/></Text>
    <Text style={s.title} accessibilityRole="header"><Copy text={award?.title||""}/></Text>
    <Text style={s.message}><Copy text={award?.message||""}/></Text>
    <Text style={s.note}><Copy text="Du hast dir diesen Erfolg verdient. Dein Fortschritt ist dokumentiert."/></Text>
    {!!error&&<Text accessibilityRole="alert" style={s.error}><Copy text={error}/></Text>}
    <Pressable style={[s.action,busy&&s.disabled]} accessibilityRole="button" disabled={busy} onPress={()=>void acknowledge()}>
     <Text style={s.actionText}><Copy text="WEITER"/></Text>
    </Pressable>
    {!still&&<Pressable style={s.quiet} accessibilityRole="button" disabled={busy} onPress={()=>void reduce()}>
     <Text style={s.quietText}><Copy text="BEWEGUNGEN REDUZIEREN"/></Text>
    </Pressable>}
    {queue.length>1&&<Text style={s.note}>{queue.length} <Copy text="bestätigte Erfolge"/></Text>}
   </View>
  </View>
 </Modal>;
}
const s=StyleSheet.create({
 shade:{flex:1,backgroundColor:"#000D",justifyContent:"center",alignItems:"center",padding:20},
 dialog:{backgroundColor:"#15221A",borderWidth:1,borderTopWidth:4,borderColor:"#86A98A",borderTopColor:C.volt,
  borderRadius:15,padding:24,width:"100%",maxWidth:440,maxHeight:"95%",alignItems:"center",gap:12},
 visual:{width:160,height:160,alignItems:"center",justifyContent:"center"},
 ring:{position:"absolute",width:105,height:105,borderWidth:2,borderColor:"#BAE89A",borderRadius:60,
  shadowColor:C.volt,shadowOpacity:.28,shadowRadius:18},
 ringFull:{width:145,height:145,borderRadius:80},
 star:{fontSize:74,color:C.volt},piece:{position:"absolute",left:"49%",top:"49%",width:6,height:6,
  backgroundColor:"#E3FF85",borderRadius:2},
 kicker:{fontSize:10,letterSpacing:1.4,color:"#BAE3B9",fontFamily:"ManropeSemiBold",textAlign:"center"},
 title:{fontSize:27,lineHeight:32,color:C.ink,fontFamily:"Archivo",textAlign:"center"},
 message:{fontSize:14,lineHeight:21,color:"#F1F7F2",fontFamily:"Manrope",textAlign:"center"},
 note:{fontSize:11,lineHeight:18,color:"#BCD3C0",fontFamily:"Manrope",textAlign:"center"},
 error:{color:"#FFC5C5",fontSize:12,textAlign:"center"},
 action:{width:"100%",minHeight:51,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",
  borderRadius:7,marginTop:8},actionText:{fontSize:13,color:"#132013",fontFamily:"ManropeSemiBold"},
 quiet:{minHeight:42,justifyContent:"center",alignItems:"center"},
 quietText:{fontSize:11,color:"#E0ECE0",fontFamily:"ManropeSemiBold",textDecorationLine:"underline"},
 disabled:{opacity:.5}
});
