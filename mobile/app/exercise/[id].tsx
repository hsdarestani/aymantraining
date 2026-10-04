import {useEffect,useState} from "react";
import {ActivityIndicator,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View,Image} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {useVideoPlayer,VideoView} from "expo-video";
import Brand from "../../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../../components/Card";
import {API,api} from "../../lib/api";
import {localMediaUri} from "../../lib/media-cache";
import {C,radius} from "../../theme";

function CoachVideo({uri}:{uri:string}){
  const player=useVideoPlayer(uri,p=>{p.loop=true;p.muted=true;p.play()});
  return <View style={s.videoWrap}><VideoView style={s.videoView} player={player} nativeControls contentFit="cover"/><Text style={s.videoHint}>WIEDERHOLUNG · TON STANDARDMÄSSIG AUS</Text></View>;
}

export default function Exercise(){
  const {id}=useLocalSearchParams<{id:string}>();
  const [x,setX]=useState<any>(null);
  const [media,setMedia]=useState<Record<string,string>>({});
  useEffect(()=>{
    api<any>(`/api/exercises/${id}`).then(async j=>{
      setX(j.item);
      const values=[j.item.imageStart,j.item.imageMiddle,j.item.imageEnd,j.item.videoUrl].filter(Boolean);
      const pairs=await Promise.all(values.map(async (u:string)=>[u,await localMediaUri(u)] as const));
      setMedia(Object.fromEntries(pairs));
    }).catch(()=>router.back());
  },[id]);

  if(!x)return <View style={s.center}><ActivityIndicator color={C.volt}/></View>;
  const images=[x.imageStart,x.imageMiddle,x.imageEnd];
  const mistakes=Array.isArray(x.commonMistakes)?x.commonMistakes:[];
  const video=x.videoUrl?media[x.videoUrl]||(x.videoUrl.startsWith("http")?x.videoUrl:API+x.videoUrl):null;

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
    <View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}>ZURÜCK</Text></Pressable></View>
    <Eyebrow>{String(x.id).replaceAll("-"," ")} · STUFE {x.level}</Eyebrow>
    <Text style={s.title}>{x.nameDe}</Text>
    <Text style={s.meta}>{x.category.toUpperCase()} · {x.equipment||"OHNE GERÄTE"}</Text>
    <View style={s.images}>{images.map((uri:any,i:number)=>uri?<Image key={uri} source={{uri:media[uri]||(uri.startsWith("http")?uri:API+uri)}} style={s.image}/>:<View key={i} style={s.placeholder}><Text style={s.placeholderText}>{["START","MITTE","ENDE"][i]}</Text></View>)}</View>
    {video&&<CoachVideo uri={video}/>}
    <Card><Eyebrow>ZIELMUSKELN</Eyebrow><SectionTitle>{x.primaryMuscles||"Keine Angabe"}</SectionTitle>{x.secondaryMuscles?<Text style={s.secondary}>{x.secondaryMuscles}</Text>:null}</Card>
    <Card><Eyebrow>TRAINERHINWEISE</Eyebrow><SectionTitle>Sauber ausführen.</SectionTitle>{[x.coachCue1,x.coachCue2,x.coachCue3].filter(Boolean).map((c:string,i:number)=><View style={s.cue} key={c}><Text style={s.cueNr}>{i+1}</Text><Text style={s.cueText}>{c}</Text></View>)}</Card>
    <Card><Eyebrow>HÄUFIGE FEHLER</Eyebrow>{mistakes.map((m:string)=><Text style={s.error} key={m}>× {m}</Text>)}</Card>
    {(x.easierExerciseId||x.harderExerciseId)&&<Card><Eyebrow>ALTERNATIVEN</Eyebrow><View style={s.alternatives}>{x.easierExerciseId&&<Pressable style={s.alt} onPress={()=>router.replace({pathname:"/exercise/[id]",params:{id:x.easierExerciseId}})}><Text style={s.altLabel}>LEICHTER</Text><Text style={s.altText}>{String(x.easierExerciseId).replaceAll("-"," ")}</Text></Pressable>}{x.harderExerciseId&&<Pressable style={s.alt} onPress={()=>router.replace({pathname:"/exercise/[id]",params:{id:x.harderExerciseId}})}><Text style={s.altLabel}>SCHWERER</Text><Text style={s.altText}>{String(x.harderExerciseId).replaceAll("-"," ")}</Text></Pressable>}</View></Card>}
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},center:{flex:1,backgroundColor:C.bg,alignItems:"center",justifyContent:"center"},content:{padding:18,paddingBottom:60,gap:12},
 top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontSize:9,fontWeight:"900"},title:{color:C.ink,fontSize:42,lineHeight:39,fontWeight:"900",letterSpacing:-2.5,marginTop:7},meta:{color:C.dim,fontSize:9,fontWeight:"800"},
 images:{flexDirection:"row",gap:6},image:{flex:1,aspectRatio:.78,borderRadius:radius.md,backgroundColor:C.panel2},placeholder:{flex:1,aspectRatio:.78,borderRadius:radius.md,backgroundColor:C.panel2,alignItems:"center",justifyContent:"center"},placeholderText:{color:C.dim,fontSize:7,fontWeight:"900"},
 videoWrap:{borderRadius:radius.lg,overflow:"hidden",backgroundColor:C.panel},videoView:{width:"100%",aspectRatio:9/16,maxHeight:520},videoHint:{position:"absolute",left:10,bottom:10,color:C.ink,backgroundColor:"#050606CC",paddingVertical:5,paddingHorizontal:8,borderRadius:20,fontSize:7,fontWeight:"900",letterSpacing:1},
 secondary:{color:C.dim,fontSize:12,marginTop:7},cue:{flexDirection:"row",gap:10,paddingVertical:10,borderBottomWidth:1,borderBottomColor:C.line},cueNr:{color:C.volt,fontWeight:"900"},cueText:{color:C.ink,flex:1,fontSize:12},error:{color:C.red,fontSize:12,paddingVertical:6},
 alternatives:{flexDirection:"row",gap:8,marginTop:12},alt:{flex:1,borderWidth:1,borderColor:C.line,borderRadius:radius.md,padding:13},altLabel:{color:C.volt,fontSize:7,fontWeight:"900",letterSpacing:1},altText:{color:C.ink,fontSize:11,fontWeight:"900",marginTop:4}
});
