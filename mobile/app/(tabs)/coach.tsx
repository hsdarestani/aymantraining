
import {Copy,LocalizedTextInput,LocalizedValue} from "../../components/Locale";


import {useCallback,useEffect,useMemo,useState} from "react";
import {Alert,Pressable,StyleSheet,Text,TextInput,View} from "react-native";
import {useFocusEffect,router} from "expo-router";
import {AudioModule,RecordingPresets,useAudioPlayer,useAudioRecorder} from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import {useVideoPlayer,VideoView} from "expo-video";
import Screen from "../../components/Screen";
import {Card,Eyebrow,SectionTitle} from "../../components/Card";
import {api,API} from "../../lib/api";
import {getSession} from "../../lib/session";
import {C,radius} from "../../theme";

function VoiceBubble({mediaId,token}:{mediaId:string;token:string}){
  const source=useMemo(()=>({uri:API+"/api/media/"+mediaId,headers:{Authorization:"Bearer "+token}}),[mediaId,token]);
  const player=useAudioPlayer(source);
  return <Pressable style={s.mediaButton} onPress={()=>player.play()}><Text style={s.mediaButtonText}><Copy text={"SPRACHNACHRICHT ABSPIELEN"}/></Text></Pressable>;
}

function VideoBubble({mediaId,token}:{mediaId:string;token:string}){
  const source=useMemo(()=>({uri:API+"/api/media/"+mediaId,headers:{Authorization:"Bearer "+token}}),[mediaId,token]);
  const player=useVideoPlayer(source,p=>{p.loop=false});
  return <VideoView style={s.video} player={player} nativeControls contentFit="cover"/>;
}

export default function Coach(){
  const [messages,setMessages]=useState<any[]>([]);
  const [text,setText]=useState("");
  const [locked,setLocked]=useState(false);
  const [token,setToken]=useState("");
  const [status,setStatus]=useState("");
  const [recording,setRecording]=useState(false);
  const [recordStarted,setRecordStarted]=useState(0);
  const recorder=useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const load=useCallback(()=>api<any>("/api/messages").then(x=>{setMessages(x.items);setLocked(false)}).catch(e=>{if(String(e.message).includes("PRO"))setLocked(true)}),[]);
  useFocusEffect(useCallback(()=>{load();getSession().then(x=>setToken(x||""))},[load]));

  useEffect(()=>{AudioModule.requestRecordingPermissionsAsync().catch(()=>undefined)},[]);

  async function send(){
    if(!text.trim())return;
    setStatus("SENDE");
    try{await api("/api/messages",{method:"POST",body:JSON.stringify({text})});setText("");setStatus("");await load()}catch(e:any){setStatus(e.message||"Senden fehlgeschlagen")}
  }

  async function upload(kind:"VOICE_MESSAGE"|"TECHNIQUE_VIDEO",asset:{uri:string;name:string;type:string}){
    const form=new FormData();
    form.append("kind",kind);
    form.append("file",{uri:asset.uri,name:asset.name,type:asset.type} as any);
    return api<any>("/api/media",{method:"POST",body:form});
  }

  async function toggleVoice(){
    if(recording){
      setStatus("SPRACHE WIRD GESPEICHERT");
      await recorder.stop();
      setRecording(false);
      const uri=recorder.uri;
      if(!uri){setStatus("AUFNAHME FEHLGESCHLAGEN");return}
      try{
        const up=await upload("VOICE_MESSAGE",{uri,name:"sprachnachricht.m4a",type:"audio/mp4"});
        await api("/api/messages",{method:"POST",body:JSON.stringify({kind:"VOICE",mediaId:up.asset.id,durationSec:Math.max(1,Math.round((Date.now()-recordStarted)/1000)),text:"Sprachnachricht"})});
        setStatus("");await load();
      }catch(e:any){setStatus(e.message||"Upload fehlgeschlagen")}
      return;
    }
    const permission=await AudioModule.requestRecordingPermissionsAsync();
    if(!permission.granted){Alert.alert("Mikrofon","Bitte erlaube den Mikrofonzugriff für Sprachnachrichten.");return}
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecordStarted(Date.now());
    setRecording(true);
    setStatus("AUFNAHME LÄUFT");
  }

  async function sendTechniqueVideo(){
    const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(!permission.granted){Alert.alert("Mediathek","Bitte erlaube den Zugriff auf deine Mediathek.");return}
    const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["videos"],quality:0.8,videoMaxDuration:120});
    if(result.canceled)return;
    const a=result.assets[0];
    setStatus("TECHNIKVIDEO WIRD HOCHGELADEN");
    try{
      const up=await upload("TECHNIQUE_VIDEO",{uri:a.uri,name:a.fileName||"technikvideo.mp4",type:a.mimeType||"video/mp4"});
      await api("/api/messages",{method:"POST",body:JSON.stringify({kind:"VIDEO",mediaId:up.asset.id,text:"Technikvideo zur Analyse"})});
      setStatus("VIDEO GESENDET");await load();
    }catch(e:any){setStatus(e.message||"Upload fehlgeschlagen")}
  }

  if(locked)return <Screen><View style={s.hero}><Eyebrow><Copy text={"DEIN TRAINER"}/></Eyebrow><Text style={s.big}><Copy text={"DIREKT."}/>{"\n"}<Copy text={"PERSÖNLICH."}/>{"\n"}PRO.</Text></View><Card><SectionTitle><Copy text={"Trainer Chat ist PRO."}/></SectionTitle><Text style={s.copy}><Copy text={"Text, Sprachnachrichten, Technikvideo und persönliche Antworten."}/></Text><Pressable style={s.primary} onPress={()=>router.push("/membership")}><Text style={s.primaryText}><Copy text={"PRO FREISCHALTEN →"}/></Text></Pressable></Card></Screen>;

  return <Screen>
    <View style={s.hero}><Eyebrow><Copy text={"DEIN TRAINER"}/></Eyebrow><Text style={s.big}>AYMAN.</Text><Text style={s.online}><Copy text={"● AKTIVE BETREUUNG"}/></Text></View>
    <Card style={s.chat}>
      <View style={s.messages}>{messages.map(m=>{
        const mine=m.senderId===m.athleteId;
        return <View style={[s.bubble,mine?s.mine:s.theirs]} key={m.id}>
          {m.text?<Text style={[s.bubbleText,mine&&s.mineText]}>{m.text}</Text>:null}
          {m.kind==="VOICE"&&m.mediaId&&token?<VoiceBubble mediaId={m.mediaId} token={token}/>:null}
          {m.kind==="VIDEO"&&m.mediaId&&token?<VideoBubble mediaId={m.mediaId} token={token}/>:null}
          <Text style={[s.time,mine&&s.mineText]}><LocalizedValue value={new Date(m.createdAt)} format="toLocaleString"/></Text>
        </View>
      })}</View>
      <View style={s.mediaActions}>
        <Pressable style={[s.mediaAction,recording&&s.recording]} onPress={toggleVoice}><Text style={s.mediaActionText}><Copy text={recording?"AUFNAHME BEENDEN":"SPRACHE AUFNEHMEN"}/></Text></Pressable>
        <Pressable style={s.mediaAction} onPress={sendTechniqueVideo}><Text style={s.mediaActionText}><Copy text={"TECHNIKVIDEO SENDEN"}/></Text></Pressable>
      </View>
      <View style={s.composer}><LocalizedTextInput value={text} onChangeText={setText} placeholder="Nachricht an Ayman…" placeholderTextColor="#666D69" style={s.input} multiline/><Pressable style={s.send} onPress={send}><Text style={s.sendText}>↑</Text></Pressable></View>
      {status?<Text style={s.status}><Copy text={status}/></Text>:null}
    </Card>
  </Screen>;
}
const s=StyleSheet.create({
  hero:{paddingVertical:18},big:{color:C.ink,fontSize:54,lineHeight:46,fontWeight:"900",letterSpacing:-3,marginTop:10},online:{color:C.green,fontSize:9,fontWeight:"900",letterSpacing:1.5,marginTop:12},copy:{color:C.dim,fontSize:13,lineHeight:20,marginVertical:14},
  chat:{minHeight:560},messages:{gap:8,flex:1},bubble:{maxWidth:"88%",paddingHorizontal:14,paddingVertical:11,borderRadius:16},mine:{alignSelf:"flex-end",backgroundColor:C.volt},theirs:{alignSelf:"flex-start",backgroundColor:C.panel2},bubbleText:{color:C.ink,fontSize:13,lineHeight:19},mineText:{color:C.bg},time:{color:C.dim,fontSize:7,marginTop:6},
  composer:{flexDirection:"row",gap:8,alignItems:"flex-end",marginTop:10},input:{flex:1,minHeight:50,maxHeight:110,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line,borderRadius:radius.md,paddingHorizontal:14,paddingVertical:13,color:C.ink},send:{width:50,height:50,borderRadius:25,backgroundColor:C.volt,alignItems:"center",justifyContent:"center"},sendText:{color:C.bg,fontSize:23,fontWeight:"900"},
  mediaActions:{flexDirection:"row",gap:8,marginTop:14},mediaAction:{flex:1,minHeight:44,borderRadius:radius.md,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center",paddingHorizontal:8},recording:{borderColor:C.red},mediaActionText:{color:C.ink,fontSize:8,fontWeight:"900",textAlign:"center"},mediaButton:{marginTop:8,paddingVertical:10,paddingHorizontal:12,borderRadius:12,backgroundColor:"#0A0A0B33"},mediaButtonText:{color:C.ink,fontSize:8,fontWeight:"900"},video:{width:240,aspectRatio:9/16,maxHeight:340,borderRadius:12,marginTop:8},status:{color:C.volt,fontSize:9,fontWeight:"900",marginTop:8,textAlign:"center"},
  primary:{height:52,backgroundColor:C.volt,borderRadius:radius.md,alignItems:"center",justifyContent:"center"},primaryText:{color:C.bg,fontSize:10,fontWeight:"900",letterSpacing:1.3}
});
