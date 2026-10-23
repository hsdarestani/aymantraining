import {useCallback,useState} from "react";
import {ActivityIndicator,Pressable,StyleSheet,Text,TextInput,View} from "react-native";
import {router,useFocusEffect} from "expo-router";
import Screen from "../components/Screen";
import {Copy} from "../components/Locale";
import {ApiError,api} from "../lib/api";
import {clearSession} from "../lib/session";
import {signOut} from "../lib/logout";
import {C,radius} from "../theme";

export default function Profile(){
 const [user,setUser]=useState<{id:string;name:string;tier:string}|null>(null);
 const [name,setName]=useState("");
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const data=await api<{user:{id:string;name:string;tier:string}}>("/api/mobile/dashboard");
   setUser(data.user);setName(data.user.name||"");
  }catch(e){
   if(e instanceof ApiError&&e.status===401){
    await clearSession();router.replace("/");return;
   }
   setError(e instanceof Error?e.message:"Profil konnte nicht geladen werden.");
  }finally{setLoading(false)}
 },[]);
 useFocusEffect(useCallback(()=>{void load()},[load]));
 async function save(){
  if(!user||name.trim().length<2||busy)return;
  setBusy(true);setError("");
  try{
   const response=await api<{user:{name:string}}>("/api/profile",{method:"PATCH",body:JSON.stringify({name:name.trim()})});
   setUser({...user,name:response.user.name});
  }catch(e){setError(e instanceof Error?e.message:"Änderung konnte nicht gespeichert werden.")}
  finally{setBusy(false)}
 }
 async function logout(){
  if(busy)return;
  setBusy(true);
  try{await signOut()}
  finally{setBusy(false)}
 }
 const entries=[
  {label:"FORTSCHRITTSBILDER",detail:"Private Bilder ansehen oder aufnehmen",route:"/progress-photos"},
  {label:"GESUNDHEITSDATEN",detail:"Verbundene Geräte und Berechtigungen",route:"/wearables"},
  {label:"MEIN ZUGANG",detail:"Mitgliedschaft und Kontostatus",route:"/membership"},
  {label:"EINSTELLUNGEN",detail:"Datenschutz, Benachrichtigungen, Sprache",route:"/settings"}
 ];
 return <Screen>
  <Text style={s.eyebrow}><Copy text="DEIN KONTO / PROFIL"/></Text>
  <Text style={s.title}><Copy text="DEIN PROFIL."/></Text>
  {loading&&!user?<ActivityIndicator color={C.volt}/>:null}
  {user?<View style={s.identity}>
   <Text style={s.caption}><Copy text="ANGEMELDET ALS"/></Text>
   <Text style={s.person}>{user.name||"ATHLET"}</Text>
   <Text style={s.membership}>{user.tier==="FREE"?"STANDARD":user.tier}</Text>
   <Text style={s.label}><Copy text="NAME BEARBEITEN"/></Text>
   <TextInput style={s.input} value={name} onChangeText={setName} autoCapitalize="words" accessibilityLabel="Name" placeholder="Dein Name" placeholderTextColor={C.dim}/>
   <Pressable accessibilityRole="button" disabled={busy||name.trim().length<2||name.trim()===user.name} onPress={save} style={[s.save,(busy||name.trim().length<2||name.trim()===user.name)&&s.disabled]}>
    <Text style={s.saveText}><Copy text={busy?"BITTE WARTEN":"ÄNDERUNG SPEICHERN"}/></Text>
   </Pressable>
  </View>:null}
  {error?<View style={s.errorBox}><Text style={s.error}>{error}</Text><Pressable onPress={()=>void load()}><Text style={s.retry}><Copy text="ERNEUT VERSUCHEN →"/></Text></Pressable></View>:null}
  {user?<View style={s.list}>
   {entries.map(item=><Pressable key={item.route} accessibilityRole="button" style={s.entry} onPress={()=>router.push(item.route as any)}>
    <View style={s.entryBody}><Text style={s.entryTitle}><Copy text={item.label}/></Text><Text style={s.detail}><Copy text={item.detail}/></Text></View><Text style={s.arrow}>↗</Text>
   </Pressable>)}
   <Pressable accessibilityRole="button" onPress={logout} style={s.logout}><Text style={s.logoutText}><Copy text="ABMELDEN"/></Text><Text style={s.arrow}>→</Text></Pressable>
  </View>:null}
 </Screen>;
}
const s=StyleSheet.create({
 eyebrow:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:10,letterSpacing:2},
 title:{color:C.ink,fontFamily:"Archivo",fontSize:37,lineHeight:41,letterSpacing:-1},
 identity:{padding:20,backgroundColor:"#131916",borderTopWidth:3,borderTopColor:C.volt,gap:12},
 caption:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1.2},
 person:{color:C.ink,fontFamily:"Archivo",fontSize:30},
 membership:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:12},
 label:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:10,marginTop:10},
 input:{height:52,borderRadius:radius.md,borderWidth:1,borderColor:C.line,backgroundColor:C.panel2,paddingHorizontal:14,color:C.ink,fontSize:14},
 save:{backgroundColor:C.volt,height:48,alignItems:"center",justifyContent:"center",borderRadius:radius.md},
 disabled:{opacity:.5},
 saveText:{color:C.bg,fontFamily:"ManropeSemiBold",fontSize:11},
 list:{gap:0,marginTop:4},
 entry:{paddingVertical:20,flexDirection:"row",alignItems:"center",borderBottomWidth:1,borderColor:C.line},
 entryBody:{flex:1,gap:6},entryTitle:{fontFamily:"Archivo",fontSize:16,color:C.ink},
 detail:{fontFamily:"Manrope",fontSize:11,color:C.dim},
 arrow:{color:C.volt,fontSize:19},
 logout:{paddingVertical:18,flexDirection:"row",justifyContent:"space-between",marginTop:10},
 logoutText:{color:C.red,fontFamily:"ManropeSemiBold",fontSize:13},
 errorBox:{padding:15,borderWidth:1,borderColor:C.red},
 error:{color:C.red,fontFamily:"Manrope",fontSize:12},
 retry:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:11,marginTop:12}
});
