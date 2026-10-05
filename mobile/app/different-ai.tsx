
import {Copy,LocalizedTextInput} from "../components/Locale";


import {useCallback,useState} from "react";
import {Pressable,StyleSheet,Text,View} from "react-native";
import {BrandInput as TextInput} from "../components/BrandInput";
import {router,useFocusEffect} from "expo-router";
import Screen from "../components/Screen";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api} from "../lib/api";
import {C,radius} from "../theme";

export default function DifferentAI(){
 const [handoff,setHandoff]=useState<any>(null),[error,setError]=useState("");
 const [items,setItems]=useState<any[]>([]),[text,setText]=useState(""),[locked,setLocked]=useState(false),[busy,setBusy]=useState(false);
 const load=useCallback(()=>api<any>("/api/ai").then(x=>{setItems(x.items||[]);setHandoff(x.handoff);setLocked(false)}).catch(e=>{if(e.status===403)setLocked(true);else setError(e.message)}),[]);
 useFocusEffect(useCallback(()=>{load()},[load]));
 async function requestCoach(){if(busy)return;setError("");setBusy(true);try{const r:any=await api("/api/ai",{method:"POST",body:JSON.stringify({message:"Ich möchte mit meinem Trainer sprechen.",action:"handoff"})});setHandoff(r.handoff);await load()}catch(e:any){setError(e.message)}finally{setBusy(false)}}
 async function send(){if(!text.trim()||busy)return;const msg=text;setText("");setError("");setBusy(true);setItems(x=>[...x,{id:"local",role:"user",content:msg,createdAt:new Date().toISOString()}]);try{const r:any=await api("/api/ai",{method:"POST",body:JSON.stringify({message:msg})});setHandoff(r.handoff);await load()}catch(e:any){setItems(x=>x.filter(y=>y.id!=="local"));setText(msg);setError(e.message||"Antwort nicht verfügbar.")}finally{setBusy(false)}}
 if(locked)return <Screen><Eyebrow>DIFFERENT AI</Eyebrow><View style={s.hero}><Text style={s.title}><Copy text={"DEIN ASSISTENT"}/>{"\n"}<Copy text={"FÜR DIE NACHT."}/></Text></View><Card><SectionTitle><Copy text={"Different AI ist PRO."}/></SectionTitle><Text style={s.copy}><Copy text={"Der Assistent nutzt deinen Verlauf und deine Regeln. Dein echter Trainer entscheidet immer final."}/></Text><Pressable style={s.primary} onPress={()=>router.push("/membership")}><Text style={s.primaryText}><Copy text={"PRO FREISCHALTEN"}/></Text></Pressable></Card></Screen>;
 return <Screen><Eyebrow>DIFFERENT AI</Eyebrow><View style={s.hero}><Text style={s.title}><Copy text={"FRAGEN."}/>{"\n"}<Copy text={"VERSTEHEN."}/>{"\n"}<Copy text={"WEITERMACHEN."}/></Text><Text style={s.copy}><Copy text={"Automatisierte Hilfe für Training und Alltag. Keine medizinische Diagnose. Dein Trainer behält die Kontrolle."}/></Text></View>{handoff&&<Text style={s.copy}><Copy text={"AN TRAINER ÜBERGEBEN"}/></Text>}{error&&<Text style={s.copy}><Copy text={error}/></Text>}<Pressable disabled={busy||Boolean(handoff)} style={s.secondary} onPress={requestCoach}><Text style={s.copy}><Copy text={"AN TRAINER ÜBERGEBEN"}/></Text></Pressable><Card style={s.chat}><View style={s.messages}>{items.map((m:any)=><View style={[s.bubble,m.role==="user"?s.user:s.ai]} key={m.id}><Text style={[s.bubbleText,m.role==="user"&&s.userText]}>{m.content}</Text></View>)}</View><View style={s.composer}><LocalizedTextInput value={text} onChangeText={setText} placeholder="Was willst du wissen?" placeholderTextColor="#666" style={s.input} multiline/><Pressable style={s.send} onPress={send}><Text style={s.sendText}>{busy?"…":"↑"}</Text></Pressable></View></Card></Screen>;
}
const s=StyleSheet.create({secondary:{padding:12,borderWidth:1,borderColor:C.line,borderRadius:12},hero:{paddingVertical:18},title:{color:C.ink,fontFamily:"Archivo",fontSize:36,lineHeight:40,letterSpacing:-.8},copy:{color:C.dim,fontFamily:"Manrope",fontSize:11,lineHeight:18,marginTop:12},primary:{height:50,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:12},primaryText:{color:C.bg,fontFamily:"ManropeSemiBold",fontSize:11,},chat:{minHeight:520},messages:{gap:8,flex:1},bubble:{maxWidth:"88%",paddingHorizontal:14,paddingVertical:11,borderRadius:16},user:{alignSelf:"flex-end",backgroundColor:C.volt},ai:{alignSelf:"flex-start",backgroundColor:C.panel2},bubbleText:{color:C.ink,fontFamily:"Manrope",fontSize:12,lineHeight:18},userText:{color:C.bg},composer:{flexDirection:"row",gap:8,alignItems:"flex-end",marginTop:14},input:{flex:1,minHeight:50,maxHeight:110,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line,borderRadius:radius.md,paddingHorizontal:14,paddingVertical:13,color:C.ink},send:{width:50,height:50,borderRadius:25,backgroundColor:C.volt,alignItems:"center",justifyContent:"center"},sendText:{color:C.bg,fontFamily:"ManropeSemiBold",fontSize:23,}});
