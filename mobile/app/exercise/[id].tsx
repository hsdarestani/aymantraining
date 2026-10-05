
import {Copy,ExerciseName} from "../../components/Locale";


import {useEffect,useMemo,useState} from "react";
import {ActivityIndicator,Dimensions,Image,Modal,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {useVideoPlayer,VideoView} from "expo-video";
import Brand from "../../components/Brand";
import {Card,Eyebrow,SectionTitle} from "../../components/Card";
import {API,api} from "../../lib/api";
import {localMediaUri} from "../../lib/media-cache";
import {C,radius} from "../../theme";

function CoachVideo({uri}:{uri:string}){
  const player=useVideoPlayer(uri,p=>{p.loop=true;p.muted=true;p.play()});
  return <View style={s.videoWrap}><VideoView style={s.videoView} player={player} nativeControls contentFit="cover"/><Text style={s.videoHint}><Copy text={"ENDLOSSCHLEIFE · TON ZUERST AUS"}/></Text></View>;
}

export default function Exercise(){
  const {id}=useLocalSearchParams<{id:string}>();
  const [x,setX]=useState<any>(null);
  const [media,setMedia]=useState<Record<string,string>>({});
  const [frame,setFrame]=useState(0);
  const [lightbox,setLightbox]=useState<number|null>(null);

  useEffect(()=>{
    api<any>(`/api/exercises/${id}`).then(async j=>{
      setX(j.item);
      const values=[j.item.imageStart,j.item.imageMiddle,j.item.imageEnd,j.item.videoUrl].filter(Boolean);
      const pairs=await Promise.all(values.map(async (u:string)=>[u,await localMediaUri(u)] as const));
      setMedia(Object.fromEntries(pairs));
    }).catch(()=>router.back());
  },[id]);

  const imageUris=useMemo(()=>{
    if(!x)return [];
    return [x.imageStart,x.imageMiddle,x.imageEnd].filter(Boolean).map((u:string)=>media[u]||(u.startsWith("http")?u:API+u));
  },[x,media]);

  useEffect(()=>{
    if(imageUris.length<2)return;
    const timer=setInterval(()=>setFrame(v=>(v+1)%imageUris.length),950);
    return()=>clearInterval(timer);
  },[imageUris.length]);

  if(!x)return <View style={s.center}><ActivityIndicator color={C.volt}/></View>;
  const images=[x.imageStart,x.imageMiddle,x.imageEnd];
  const mistakes=Array.isArray(x.commonMistakes)?x.commonMistakes:[];
  const video=x.videoUrl?media[x.videoUrl]||(x.videoUrl.startsWith("http")?x.videoUrl:API+x.videoUrl):null;
  const labels=["START","MITTE","ENDE"];
  const width=Dimensions.get("window").width;

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
    <View style={s.top}><Brand compact/><Pressable onPress={()=>router.back()}><Text style={s.back}><Copy text={"ZURÜCK"}/></Text></Pressable></View>
    <Eyebrow>{String(x.id).replaceAll("-"," ")}<Copy text={"· STUFE"}/>{x.level}</Eyebrow>
    <Text style={s.title}><ExerciseName exercise={x}/></Text>
    <Text style={s.meta}>{x.category.toUpperCase()} · {x.equipment||"OHNE GERÄTE"}</Text>

    {imageUris.length?<Pressable style={s.motion} onPress={()=>setLightbox(frame)}><Image source={{uri:imageUris[frame]}} style={s.motionImage}/><View style={s.motionLabel}><Text style={s.motionLabelText}>{labels[frame]}<Copy text={"· BEWEGUNGSABLAUF"}/></Text></View></Pressable>:null}
    <View style={s.images}>{images.map((uri:any,i:number)=>uri?<Pressable key={uri} style={s.imageButton} onPress={()=>setLightbox(i)}><Image source={{uri:media[uri]||(uri.startsWith("http")?uri:API+uri)}} style={s.image}/><Text style={s.imageLabel}>{labels[i]}</Text></Pressable>:<View key={i} style={s.placeholder}><Text style={s.placeholderText}>{labels[i]}</Text></View>)}</View>
    {video&&<CoachVideo uri={video}/>}
    <Card><Eyebrow><Copy text={"ZIELMUSKELN"}/></Eyebrow><SectionTitle>{x.primaryMuscles||"Keine Angabe"}</SectionTitle>{x.secondaryMuscles?<Text style={s.secondary}>{x.secondaryMuscles}</Text>:null}</Card>
    <Card><Eyebrow><Copy text={"TRAINERHINWEISE"}/></Eyebrow><SectionTitle><Copy text={"Sauber ausführen."}/></SectionTitle>{[x.coachCue1,x.coachCue2,x.coachCue3].filter(Boolean).map((c:string,i:number)=><View style={s.cue} key={c}><Text style={s.cueNr}>{i+1}</Text><Text style={s.cueText}>{c}</Text></View>)}</Card>
    <Card><Eyebrow><Copy text={"HÄUFIGE FEHLER"}/></Eyebrow>{mistakes.map((m:string)=><Text style={s.error} key={m}>× {m}</Text>)}</Card>
    {(x.easierExerciseId||x.harderExerciseId)&&<Card><Eyebrow><Copy text={"ALTERNATIVEN"}/></Eyebrow><View style={s.alternatives}>{x.easierExerciseId&&<Pressable style={s.alt} onPress={()=>router.replace({pathname:"/exercise/[id]",params:{id:x.easierExerciseId}})}><Text style={s.altLabel}><Copy text={"LEICHTER"}/></Text><Text style={s.altText}>{String(x.easierExerciseId).replaceAll("-"," ")}</Text></Pressable>}{x.harderExerciseId&&<Pressable style={s.alt} onPress={()=>router.replace({pathname:"/exercise/[id]",params:{id:x.harderExerciseId}})}><Text style={s.altLabel}><Copy text={"SCHWERER"}/></Text><Text style={s.altText}>{String(x.harderExerciseId).replaceAll("-"," ")}</Text></Pressable>}</View></Card>}

    <Modal visible={lightbox!=null} animationType="fade" transparent onRequestClose={()=>setLightbox(null)}>
      <View style={s.modal}><Pressable style={s.close} onPress={()=>setLightbox(null)}><Text style={s.closeText}><Copy text={"SCHLIESSEN"}/></Text></Pressable><ScrollView horizontal pagingEnabled contentOffset={{x:(lightbox||0)*width,y:0}} showsHorizontalScrollIndicator={false}>{imageUris.map((uri,i)=><View key={uri} style={[s.slide,{width}]}><Image source={{uri}} resizeMode="contain" style={s.fullImage}/><Text style={s.fullLabel}>{labels[i]}</Text></View>)}</ScrollView><Text style={s.swipe}><Copy text={"WISCHEN FÜR DEN NÄCHSTEN BILDSCHRITT"}/></Text></View>
    </Modal>
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},center:{flex:1,backgroundColor:C.bg,alignItems:"center",justifyContent:"center"},content:{padding:18,paddingBottom:60,gap:12},
 top:{height:54,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},back:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,},title:{color:C.ink,fontFamily:"Archivo",fontSize:36,lineHeight:40,letterSpacing:-.8,marginTop:7},meta:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,},
 motion:{borderRadius:radius.lg,overflow:"hidden",backgroundColor:C.panel2},motionImage:{width:"100%",aspectRatio:4/5,backgroundColor:C.panel2},motionLabel:{position:"absolute",left:10,bottom:10,paddingVertical:6,paddingHorizontal:9,borderRadius:20,backgroundColor:"#050606D9"},motionLabelText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1},
 images:{flexDirection:"row",gap:6},imageButton:{flex:1},image:{width:"100%",aspectRatio:.78,borderRadius:radius.md,backgroundColor:C.panel2},imageLabel:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,textAlign:"center",marginTop:4},placeholder:{flex:1,aspectRatio:.78,borderRadius:radius.md,backgroundColor:C.panel2,alignItems:"center",justifyContent:"center"},placeholderText:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,},
 videoWrap:{borderRadius:radius.lg,overflow:"hidden",backgroundColor:C.panel},videoView:{width:"100%",aspectRatio:9/16,maxHeight:520},videoHint:{position:"absolute",left:10,bottom:10,color:C.ink,backgroundColor:"#050606CC",paddingVertical:5,paddingHorizontal:8,borderRadius:20,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1},
 secondary:{color:C.dim,fontFamily:"Manrope",fontSize:12,marginTop:7},cue:{flexDirection:"row",gap:10,paddingVertical:10,borderBottomWidth:1,borderBottomColor:C.line},cueNr:{color:C.volt,fontWeight:"900"},cueText:{color:C.ink,flex:1,fontFamily:"Manrope",fontSize:12},error:{color:C.red,fontFamily:"Manrope",fontSize:12,paddingVertical:6},
 alternatives:{flexDirection:"row",gap:8,marginTop:12},alt:{flex:1,borderWidth:1,borderColor:C.line,borderRadius:radius.md,padding:13},altLabel:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1},altText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:11,marginTop:4},
 modal:{flex:1,backgroundColor:"#050606FA",justifyContent:"center"},close:{position:"absolute",top:58,right:20,zIndex:4,paddingVertical:10,paddingHorizontal:12,borderRadius:20,borderWidth:1,borderColor:C.line},closeText:{color:C.ink,fontFamily:"ManropeSemiBold",fontSize:11,},slide:{height:"100%",alignItems:"center",justifyContent:"center",paddingHorizontal:22},fullImage:{width:"100%",height:"70%"},fullLabel:{color:C.volt,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:2,marginTop:12},swipe:{position:"absolute",bottom:52,alignSelf:"center",color:C.dim,fontFamily:"ManropeSemiBold",fontSize:11,letterSpacing:1}
});
