
import {Copy,ExerciseName,LocalizedTextInput} from "../components/Locale";


import {useEffect,useRef,useState} from "react";
import {ActivityIndicator,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";
import {BrandInput as TextInput} from "../components/BrandInput";
import {router} from "expo-router";
import Brand from "../components/Brand";import {Card,Eyebrow} from "../components/Card";import {api} from "../lib/api";import {FieldState} from "../components/FieldKit";
import {C,radius} from "../theme";
export default function Library(){const [items,setItems]=useState<any[]|null>(null),[q,setQ]=useState(""),[error,setError]=useState("");const request=useRef(0);
async function load(query=""){
 const id=++request.current;setItems(null);setError("");
 try{const x=await api<{items:any[]}>("/api/exercises"+(query?"?q="+encodeURIComponent(query):""));if(request.current===id)setItems(x.items)}
 catch{if(request.current===id){setItems([]);setError("Deine Übungen konnten nicht geladen werden.")}}
}useEffect(()=>{load()},[]);return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}><Copy text={"ZURÜCK"}/></Text></Pressable></View><Eyebrow><Copy text={"ÜBUNGSBIBLIOTHEK"}/></Eyebrow><Text style={s.title}><Copy text={"ANSEHEN."}/>{"\n"}<Copy text={"VERSTEHEN."}/>{"\n"}<Copy text={"SAUBER AUSFÜHREN."}/></Text><View style={s.search}><LocalizedTextInput style={s.input} value={q} onChangeText={setQ} placeholder="Übung oder Equipment" placeholderTextColor="#89928A" returnKeyType="search" onSubmitEditing={()=>load(q)}/><Pressable style={s.searchBtn} onPress={()=>load(q)}><Text style={s.searchText}><Copy text={"SUCHEN"}/></Text></Pressable></View><FieldState loading={items===null} error={error} retry={()=>void load(q)}/>
{!error&&items?.length===0?<Text style={s.meta}><Copy text="Keine passende Übung gefunden."/></Text>:null}
{items?.map(x=><Pressable key={x.id} onPress={()=>router.push({pathname:"/exercise/[id]",params:{id:x.id}})}><Card><View style={s.row}><Text style={s.nr}>{x.id.slice(-3)}</Text><View style={s.flex}><Text style={s.name}><ExerciseName exercise={x}/></Text><Text style={s.meta}>{x.category.toUpperCase()}<Copy text={"· STUFE"}/>{x.level} · {x.equipment||"OHNE GERÄTE"}</Text></View></View></Card></Pressable>)}</ScrollView></SafeAreaView>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:60,gap:10},top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,},title:{color:C.ink,fontFamily:"Archivo",fontSize:36,lineHeight:40,letterSpacing:-.8,marginVertical:12},search:{flexDirection:"row",gap:7,marginBottom:4},input:{flex:1,height:50,borderRadius:radius.md,borderWidth:1,borderColor:C.line,backgroundColor:C.panel2,color:C.ink,paddingHorizontal:13},searchBtn:{width:52,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center"},searchText:{color:C.bg,fontWeight:"900"},row:{flexDirection:"row",alignItems:"center",gap:11},nr:{color:"#343936",fontFamily:"Archivo",fontSize:26,},flex:{flex:1},name:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:16,},meta:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,marginTop:4},arrow:{color:C.volt,fontFamily:"Manrope",fontSize:20}});
