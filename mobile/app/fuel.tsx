
import {Copy,LocalizedTextInput} from "../components/Locale";
import {useEffect,useState} from "react";
import {Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";
import {BrandInput as TextInput} from "../components/BrandInput";
import {router,useLocalSearchParams} from "expo-router";
import Brand from "../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../components/Card";
import {api} from "../lib/api";
import {C,radius} from "../theme";

export default function Fuel(){
 const params=useLocalSearchParams<{calories?:string;proteinG?:string;carbsG?:string;fatG?:string}>();
 const [items,setItems]=useState<any[]>([]),[targets,setTargets]=useState<any>({proteinG:130,waterMl:2500,calories:2200});
 const [form,setForm]=useState({calories:"",proteinG:"",carbsG:"",fatG:"",waterMl:"",fruitVegServings:"",addedSugarG:"",processedFoodScore:""});
 const [status,setStatus]=useState("");
 async function load(){try{const x:any=await api("/api/nutrition");setItems(x.items||[]);setTargets(x.targets||targets)}catch(e:any){setStatus(e.message||"ERNÄHRUNG IST PRO.")}}
 useEffect(()=>{load();setForm(x=>({...x,calories:params.calories||x.calories,proteinG:params.proteinG||x.proteinG,carbsG:params.carbsG||x.carbsG,fatG:params.fatG||x.fatG}))},[params.calories,params.proteinG,params.carbsG,params.fatG]);
 async function save(next=form){setStatus("SPEICHERN");try{await api("/api/nutrition",{method:"POST",body:JSON.stringify(Object.fromEntries(Object.entries(next).map(([k,v])=>[k,v===""?undefined:Number(v)])))});setForm(next);setStatus("ERNÄHRUNG GESPEICHERT");await load()}catch(e:any){setStatus(e.message||"Fehler")}}
 async function water(amount:number){const next={...form,waterMl:String((Number(form.waterMl)||Number(items[0]?.waterMl)||0)+amount)};await save(next)}
 const today=items[0],grade=today?.fuelGrade||"E";
 const inputs=[["calories","Kalorien"],["proteinG","Protein g"],["carbsG","Kohlenhydrate g"],["fatG","Fett g"],["fruitVegServings","Obst und Gemüse Portionen"],["addedSugarG","Zugesetzter Zucker g"],["processedFoodScore","Verarbeitete Lebensmittel 0 bis 100"]] as const;
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}><Copy text={"ZURÜCK"}/></Text></Pressable></View>
  <Eyebrow>BE FUEL</Eyebrow><Text style={s.title}><Copy text={"ERNÄHRE"}/>{"\n"}<Copy text={"DEN ATHLETEN."}/></Text>
  <Card style={s.gradeCard}><View><Eyebrow><Copy text={"HEUTE"}/></Eyebrow><Text style={s.grade}>{grade}</Text></View><View style={s.scoreWrap}><Text style={s.score}>{today?.fuelScore??0}</Text><Text style={s.scoreLabel}><Copy text={"VON 100"}/></Text></View></Card>
  <Card><Eyebrow><Copy text={"TAGESZIELE"}/></Eyebrow><View style={s.targets}><Text style={s.target}><Copy text={"KALORIEN"}/>{targets.calories}</Text><Text style={s.target}>PROTEIN {Math.round(targets.proteinG)} g</Text><Text style={s.target}><Copy text={"WASSER"}/>{targets.waterMl} ml</Text></View></Card>
  <View style={s.barcodeInfo}><Text style={s.barcodeKicker}>BARCODE SYSTEM</Text><Text style={s.barcodeTitle}>SCANNEN. PRÜFEN. ÜBERNEHMEN.</Text><View style={s.barcodeSteps}><Text style={s.barcodeStep}>01 · Kamera auf den EAN/UPC Code richten</Text><Text style={s.barcodeStep}>02 · Produkt und Werte werden geladen</Text><Text style={s.barcodeStep}>03 · Werte mit einem Tap in BE FUEL übernehmen</Text></View><Text style={s.barcodeNote}>Die Produktdaten sind eine Eingabehilfe. Du entscheidest, was gespeichert wird.</Text></View>
  <Pressable style={s.scan} onPress={()=>router.push("/barcode")}><Text style={s.scanText}><Copy text={"BARCODE SCANNEN →"}/></Text></Pressable>
  <Card><Eyebrow><Copy text={"WASSER"}/></Eyebrow><SectionTitle>{Number(form.waterMl)||today?.waterMl||0} ml</SectionTitle><View style={s.waterRow}>{[250,500,750].map(n=><Pressable key={n} style={s.water} onPress={()=>water(n)}><Text style={s.waterText}>+ {n} ml</Text></Pressable>)}</View></Card>
  <Card><Eyebrow><Copy text={"TAGESWERTE"}/></Eyebrow><View style={s.grid}>{inputs.map(([k,label])=><LocalizedTextInput key={k} style={s.input} value={(form as any)[k]} onChangeText={x=>setForm({...form,[k]:x})} keyboardType="decimal-pad" placeholder={label} placeholderTextColor="#626864"/>)}</View><Pressable style={s.primary} onPress={()=>save()}><Text style={s.primaryText}><Copy text={"SPEICHERN →"}/></Text></Pressable></Card>
  <Card><Eyebrow><Copy text={"BEWERTUNG"}/></Eyebrow><Text style={s.copy}><Copy text={"Die Ernährungsbewertung berücksichtigt Zielkalorien, Protein, Wasser, Obst und Gemüse, Zucker und den Anteil stark verarbeiteter Lebensmittel. Sie ist eine eigene Tagesbewertung und keine offizielle Produktbewertung."}/></Text></Card>
  {status?<Text style={s.status}><Copy text={status}/></Text>:null}
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:60,gap:12},top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,},title:{color:C.ink,fontFamily:"Archivo",fontSize:36,lineHeight:40,letterSpacing:-.8,marginVertical:12},gradeCard:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},grade:{color:C.volt,fontFamily:"Archivo",fontSize:84,lineHeight:88},scoreWrap:{alignItems:"flex-end"},score:{color:C.ink,fontFamily:"Archivo",fontSize:46,},scoreLabel:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,},targets:{gap:7,marginTop:10},target:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:11,},copy:{color:C.dim,fontFamily:"Manrope",fontSize:11,lineHeight:17,marginTop:10},grid:{gap:8,marginTop:14},input:{height:50,borderRadius:radius.md,borderWidth:1,borderColor:C.line,backgroundColor:C.panel2,color:C.ink,paddingHorizontal:13,fontFamily:"Manrope",fontSize:14},primary:{height:50,borderRadius:radius.md,backgroundColor:C.volt,alignItems:"center",justifyContent:"center",marginTop:12},primaryText:{color:C.bg,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1},barcodeInfo:{padding:16,backgroundColor:"#161113",borderLeftWidth:3,borderLeftColor:C.red},barcodeKicker:{color:C.red,fontFamily:"ManropeSemiBold",fontSize:9,letterSpacing:1.5},barcodeTitle:{color:C.ink,fontFamily:"Archivo",fontSize:21,marginTop:5},barcodeSteps:{gap:6,marginTop:12},barcodeStep:{color:C.ink,fontFamily:"Manrope",fontSize:11,lineHeight:16},barcodeNote:{color:C.dim,fontFamily:"Manrope",fontSize:10,lineHeight:15,marginTop:10},scan:{height:50,borderRadius:radius.md,borderWidth:1,borderColor:"#FF566A88",backgroundColor:"#2A1115",alignItems:"center",justifyContent:"center"},scanText:{color:C.red,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1},waterRow:{flexDirection:"row",gap:7,marginTop:10},water:{flex:1,height:42,borderRadius:12,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},waterText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:11,},status:{color:C.green,fontFamily:"Manrope",fontSize:11,textAlign:"center"}});
