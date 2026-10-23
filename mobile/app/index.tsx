
import {Copy,LocalizedTextInput} from "../components/Locale";
import {useCallback,useState} from "react";import {ActivityIndicator,KeyboardAvoidingView,Platform,Pressable,StyleSheet,Text,View,Linking,ScrollView} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {ApiError} from "../lib/api";
import {clearSession} from "../lib/session";
import {BrandInput as TextInput} from "../components/BrandInput";import {router,useFocusEffect} from "expo-router";import Brand from "../components/Brand";import {API,api} from "../lib/api";import {getSession,setSession} from "../lib/session";import {C,radius} from "../theme";
export default function Login(){const [register,setRegister]=useState(false),[name,setName]=useState(""),[checking,setChecking]=useState(true),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);useFocusEffect(useCallback(()=>{
  let active=true;
  setChecking(true);
  void getSession().then(async token=>{
    if(!active)return;
    if(token){
      try{
        const d:any=await api("/api/mobile/dashboard");
        // A pending authenticated request must never put the user back into
        // their private dashboard after logout clears that token.
        if(!active)return;
        if((await getSession())!==token){setChecking(false);return}
        await setSession(token,d.user.id);
        router.replace(d.user?.onboardingCompleted?"/(tabs)":"/onboarding");
        return;
      }catch(e){
        if(e instanceof ApiError&&e.status===401)await clearSession();
      }
    }
    if(active)setChecking(false);
  }).catch(()=>{if(active)setChecking(false)});
  return()=>{active=false};
},[]));async function login(){setBusy(true);setError("");try{const j:any=await api(register?"/api/auth/register":"/api/auth/login",{method:"POST",headers:{"content-type":"application/json","x-bd-client":"mobile"},body:JSON.stringify({email,password,...(register?{name}: {})})});await setSession(j.sessionToken,j.user.id);let destination:"/(tabs)"|"/onboarding"="/(tabs)";try{const d:any=await api("/api/mobile/dashboard");destination=d.user?.onboardingCompleted?"/(tabs)":"/onboarding"}catch(e){if(e instanceof ApiError&&e.status===401){await clearSession();throw e;}}router.replace(destination)}catch(e:any){setError(e.message||"Login fehlgeschlagen.")}finally{setBusy(false)}}if(checking)return <SafeAreaView style={s.safe}><ActivityIndicator color={C.volt}/></SafeAreaView>;return <SafeAreaView style={s.safe}><KeyboardAvoidingView style={s.flex} behavior={Platform.OS==="ios"?"padding":undefined}><ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"><Brand/><View style={s.hero}><Text style={s.kicker}><Copy text={"NORMAL IST LANGWEILIG."}/></Text><Text style={s.title}><Copy text="BUILD YOUR"/>{"\n"}<Text style={{color:C.volt}}><Copy text="ATHLETE."/></Text></Text><Text style={s.copy}><Copy text={"Training. Regeneration. Betreuung. Ein System für deine Entwicklung."}/></Text></View><View style={s.form}>{register?<TextInput style={s.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={C.dim}/>:null}<LocalizedTextInput style={s.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="E Mail" placeholderTextColor={C.dim}/><LocalizedTextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Passwort" placeholderTextColor={C.dim} onSubmitEditing={login} returnKeyType="go"/>{error?<Text style={s.error}><Copy text={error}/></Text>:null}<Pressable style={({pressed})=>[s.primary,pressed&&s.pressed]} onPress={login} disabled={busy||!email.trim()||!password}><Text style={s.primaryText}><Copy text={busy?"WIRD GESPEICHERT…":register?"KONTO ERSTELLEN →":"SYSTEM ÖFFNEN →"}/></Text></Pressable><Pressable onPress={()=>{setRegister(!register);setError("")}} disabled={busy}><Text style={s.link}><Copy text={register?"BEREITS EIN KONTO? ANMELDEN":"NEU HIER? KONTO ERSTELLEN"}/></Text></Pressable>{!register?<Pressable onPress={()=>Linking.openURL(API+"/forgot-password")}><Text style={s.link}><Copy text={"PASSWORT VERGESSEN?"}/></Text></Pressable>:null}</View></ScrollView></KeyboardAvoidingView></SafeAreaView>}
const s=StyleSheet.create({link:{color:C.volt,textAlign:"center",fontFamily:"ManropeSemiBold",fontSize:11,paddingVertical:5},safe:{flex:1,backgroundColor:C.bg},flex:{flex:1},wrap:{flexGrow:1,paddingHorizontal:22,paddingTop:28,paddingBottom:40,gap:22,justifyContent:"flex-start"},hero:{paddingTop:28,paddingBottom:8},kicker:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:2.2},title:{color:C.ink,fontFamily:"Archivo",fontSize:44,lineHeight:46,letterSpacing:-.8,marginTop:14},copy:{color:C.dim,fontFamily:"Manrope",fontSize:13,lineHeight:20,maxWidth:320,marginTop:16},form:{gap:14,padding:18,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:radius.lg,paddingBottom:18},input:{backgroundColor:C.panel2,borderWidth:1,borderColor:C.line,borderRadius:radius.md,paddingHorizontal:16,height:56,color:C.ink,fontFamily:"Manrope",fontSize:15},primary:{height:58,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:4},primaryText:{color:C.bg,fontFamily:"ManropeSemiBold",fontSize:12,letterSpacing:1.2},pressed:{transform:[{scale:.985}]},error:{color:C.red,fontFamily:"Manrope",fontSize:12}});
