import {Text,View,Switch} from "react-native";
import {Card,SectionTitle} from "./Card";
import {useCoachVoice} from "../lib/coach-voice";
import {C} from "../theme";
export default function VoicePreference(){const v=useCoachVoice(),de=v.locale==="de";return <Card><SectionTitle>{de?"Sprachbegleitung":"Coach voice"}</SectionTitle><View style={{flexDirection:"row",alignItems:"center",gap:12,marginTop:12}}><Text style={{flex:1,color:C.ink}}>{de?"Trainerstimme beim Training und in BE FOCUSED":"Coach voice during training and BE FOCUSED"}</Text><Switch accessibilityLabel={de?"Sprachbegleitung":"Coach voice"} value={v.enabled} disabled={!v.ready} onValueChange={value=>void v.change(value)} trackColor={{false:C.line,true:C.volt}}/></View>{v.error&&<Text style={{color:C.dim,marginTop:8}}>{de?"Einstellung nicht verfügbar.":"Setting unavailable."}</Text>}</Card>}
