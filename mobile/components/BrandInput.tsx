import React,{useState} from "react";
import {StyleSheet,Text,TextInput,TextInputProps,View} from "react-native";
import {C,radius} from "../theme";

/** Persistent field identity and shared focus states for every native form. */
export const BrandInput=React.forwardRef<TextInput,TextInputProps>((props,ref)=>{
 const [focused,setFocused]=useState(false);
 const flat=StyleSheet.flatten(props.style)||{};
 const {width,flex,flexGrow,flexBasis,alignSelf,margin,marginTop,marginBottom,marginLeft,marginRight,marginHorizontal,marginVertical}=flat;
 const label=props.accessibilityLabel||props.placeholder;
 return <View style={{width,flex,flexGrow,flexBasis,alignSelf,margin,marginTop,marginBottom,marginLeft,marginRight,marginHorizontal,marginVertical,gap:7}}>
  {label?<Text style={s.label}>{label}</Text>:null}
  <TextInput {...props} ref={ref} accessibilityLabel={label} placeholderTextColor={C.dim}
   onFocus={e=>{setFocused(true);props.onFocus?.(e)}} onBlur={e=>{setFocused(false);props.onBlur?.(e)}}
   style={[props.style,s.input,{width:"100%",flex:undefined,margin:0,marginTop:0,marginBottom:0,marginLeft:0,marginRight:0,marginHorizontal:0,marginVertical:0},props.multiline&&s.multiline,focused&&s.focused,props.editable===false&&s.disabled]}/>
 </View>;
});
BrandInput.displayName="BrandInput";
const s=StyleSheet.create({label:{color:C.dim,fontFamily:"ManropeSemiBold",fontSize:12,lineHeight:17},input:{backgroundColor:C.panel2,borderWidth:1,borderColor:"#3E4A52",borderRadius:radius.md,color:C.ink,fontFamily:"Manrope",fontSize:16,minHeight:50,paddingHorizontal:14,paddingVertical:12},multiline:{minHeight:110,textAlignVertical:"top"},focused:{borderColor:C.volt},disabled:{opacity:.5}});
