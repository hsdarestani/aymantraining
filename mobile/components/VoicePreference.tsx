import {Text,View,Switch} from "react-native";
import {Card,SectionTitle} from "./Card";
import {useCoachVoice} from "../lib/coach-voice";
import {C} from "../theme";
export default function VoicePreference(){const v=useCoachVoice(),de=v.locale==="de";const labels=de?{title:"Sprachbegleitung",description:"Trainerstimme beim Training und in BE FOCUSED",error:"Einstellung nicht verfügbar."}:{title:"Coach voice",description:"Coach voice during training and BE FOCUSED",error:"Setting unavailable."};return <Card><SectionTitle>{labels.title}</SectionTitle><View style={{flexDirection:"row",alignItems:"center",gap:12,marginTop:12}}><Text style={{flex:1,color:C.ink}}>{labels.description}</Text><Switch accessibilityLabel={labels.title} value={v.enabled} disabled={!v.ready} onValueChange={value=>void v.change(value)} trackColor={{false:C.line,true:C.volt}}/></View>{v.error&&<Text style={{color:C.dim,marginTop:8}}>{labels.error}</Text>}</Card>}
