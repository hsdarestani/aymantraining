
import {Copy,LocalizedTextInput,LocalizedValue} from "../components/Locale";


import {useEffect,useState} from "react";
import {Image,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,TextInput,View} from "react-native";
import {router} from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Brand from "../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api} from "../lib/api";
import {C,radius} from "../theme";

export default function Checkin(){
 const [v,setV]=useState({weightKg:"",energy:"7",recovery:"7",training:"7",note:"",questions:""});
 const [history,setHistory]=useState<any[]>([]),[status,setStatus]=useState(""),[photo,setPhoto]=useState<{uri:string;mediaId?:string}|null>(null);
 async function load(){const x:any=await api("/api/checkin");setHistory(x.items||[])}
 useEffect(()=>{load().catch(e=>{if(String(e.message).includes("PRO"))router.replace("/membership")})},[]);

 async function choosePhoto(){
  const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
  if(!permission.granted){setStatus("Bitte Zugriff auf deine Mediathek erlauben.");return}
  const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],quality:0.9,allowsEditing:false});
  if(result.canceled)return;
  const a=result.assets[0];setStatus("FOTO WIRD HOCHGELADEN");
  try{
   await api("/api/consent",{method:"POST",body:JSON.stringify({type:"media_processing",version:"1.0",granted:true})});
   const form=new FormData();form.append("kind","PROGRESS_PHOTO");form.append("file",{uri:a.uri,name:a.fileName||"wochencheck.jpg",type:a.mimeType||"image/jpeg"} as any);
   const up:any=await api("/api/media",{method:"POST",body:form});
   setPhoto({uri:a.uri,mediaId:up.asset.id});setStatus("FOTO PRIVAT GESPEICHERT");
  }catch(e:any){setStatus(e.message||"Foto konnte nicht gespeichert werden.")}
 }
 async function save(){
  try{
   await api("/api/checkin",{method:"POST",body:JSON.stringify({weightKg:Number(v.weightKg)||undefined,energy:Number(v.energy),recovery:Number(v.recovery),training:Number(v.training),note:v.note||undefined,questions:v.questions||undefined,photoMediaId:photo?.mediaId})});
   setStatus("WOCHENCHECK GESPEICHERT");await load();
  }catch(e:any){setStatus(e.message||"Fehler")}
 }
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}><Copy text={"ZURÜCK"}/></Text></Pressable></View>
  <Eyebrow><Copy text={"WOCHENCHECK"}/></Eyebrow><Text style={s.title}><Copy text={"WIE LÄUFT"}/>{"\n"}<Copy text={"DEINE WOCHE?"}/></Text>
  <Card><SectionTitle><Copy text={"Kurzer Check"}/></SectionTitle>
   <LocalizedTextInput style={s.input} value={v.weightKg} onChangeText={x=>setV({...v,weightKg:x})} keyboardType="decimal-pad" placeholder="Gewicht kg" placeholderTextColor="#666"/>
   {[["energy","ENERGIE"],["recovery","REGENERATION"],["training","TRAINING"]].map(([key,label])=><View key={key} style={s.scale}><Text style={s.label}><Copy text={label}/></Text><View style={s.choices}>{[1,2,3,4,5,6,7,8,9,10].map(n=><Pressable key={n} style={[s.choice,Number((v as any)[key])===n&&s.choiceOn]} onPress={()=>setV({...v,[key]:String(n)})}><Text style={[s.choiceText,Number((v as any)[key])===n&&s.choiceTextOn]}>{n}</Text></Pressable>)}</View></View>)}
   <LocalizedTextInput style={[s.input,s.multi]} value={v.note} onChangeText={x=>setV({...v,note:x})} placeholder="Wie fühlst du dich?" placeholderTextColor="#666" multiline/>
   <LocalizedTextInput style={[s.input,s.multi]} value={v.questions} onChangeText={x=>setV({...v,questions:x})} placeholder="Fragen an den Trainer" placeholderTextColor="#666" multiline/>
   <Pressable style={s.photoButton} onPress={choosePhoto}><Text style={s.photoButtonText}><Copy text={photo?"FORTSCHRITTSBILD ÄNDERN":"FORTSCHRITTSBILD HINZUFÜGEN"}/></Text></Pressable>
   {photo?<Image source={{uri:photo.uri}} style={s.photo}/>:null}
   <Pressable style={s.primary} onPress={save}><Text style={s.primaryText}><Copy text={"CHECK SPEICHERN"}/></Text></Pressable>{status?<Text style={s.status}><Copy text={status}/></Text>:null}
  </Card>
  <Card><Eyebrow><Copy text={"VERLAUF"}/></Eyebrow>{history.slice(0,8).map(x=><View style={s.history} key={x.id}><Text style={s.label}><LocalizedValue value={new Date(x.weekStart)} format="toLocaleDateString"/></Text><Text style={s.note}><Copy text={"Energie"}/>{x.energy??"Keine Angabe"}<Copy text={"· Regeneration"}/>{x.recovery??"Keine Angabe"} · Training {x.training??"Keine Angabe"}<Copy text={x.photoMediaId?" · Bild gespeichert":""}/></Text></View>)}</Card>
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:70,gap:12},top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontSize:9,fontWeight:"900"},title:{color:C.ink,fontSize:45,lineHeight:39,fontWeight:"900",letterSpacing:-3,marginVertical:12},input:{minHeight:50,borderRadius:radius.md,borderWidth:1,borderColor:C.line,backgroundColor:C.panel2,color:C.ink,paddingHorizontal:13,marginTop:9},multi:{minHeight:90,textAlignVertical:"top",paddingTop:12},scale:{marginTop:14},label:{color:C.ink,fontSize:9,fontWeight:"900",letterSpacing:1},choices:{flexDirection:"row",flexWrap:"wrap",gap:5,marginTop:7},choice:{width:30,height:30,borderRadius:9,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},choiceOn:{backgroundColor:C.volt,borderColor:C.volt},choiceText:{color:C.ink,fontSize:9,fontWeight:"900"},choiceTextOn:{color:C.bg},photoButton:{height:48,borderRadius:radius.md,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center",marginTop:12},photoButtonText:{color:C.ink,fontSize:8,fontWeight:"900"},photo:{width:"100%",aspectRatio:4/5,borderRadius:radius.md,marginTop:10,backgroundColor:C.panel2},primary:{height:50,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:14},primaryText:{color:C.bg,fontSize:9,fontWeight:"900"},status:{color:C.green,textAlign:"center",fontSize:10,marginTop:8},history:{paddingVertical:10,borderBottomWidth:1,borderBottomColor:C.line},note:{color:C.dim,fontSize:9,lineHeight:14,marginTop:4}});
