import {StyleSheet,Text,View} from "react-native";import {C} from "../theme";
export default function Brand({compact=false}:{compact?:boolean}){return <View style={s.row}><Text style={[s.text,compact&&s.compact]}>BE </Text><Text style={[s.text,s.volt,compact&&s.compact]}>DIFFERENT</Text></View>}
const s=StyleSheet.create({row:{flexDirection:"row",alignItems:"center"},text:{color:C.ink,fontSize:24,fontWeight:"900",letterSpacing:-1.5},compact:{fontSize:18},volt:{color:C.volt}});
