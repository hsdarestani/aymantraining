import React from 'react';
import {useSegments} from 'expo-router';
import {Text,TextInput,TextInputProps,Pressable} from 'react-native';
import {useLocale,translate,setLocale} from '../lib/i18n/locale';
import {api} from '../lib/api';
import {BrandInput} from './BrandInput';
export function Copy({text}:{text:React.ReactNode}){useLocale();return <Text>{typeof text==='string'?translate(text):text}</Text>}
export const LocalizedTextInput=React.forwardRef<TextInput,TextInputProps>((props,ref)=>{useLocale();return <BrandInput {...props} ref={ref} placeholder={props.placeholder?translate(props.placeholder):undefined} accessibilityLabel={props.accessibilityLabel?translate(props.accessibilityLabel):undefined}/>});
LocalizedTextInput.displayName='LocalizedTextInput';
export function LanguagePicker({inline=false}:{inline?:boolean}){const locale=useLocale();const segments=useSegments();if(segments[0]==='(tabs)'&&!inline)return null;return <Pressable accessibilityRole="button" accessibilityLabel={locale==='de'?"Current language German. Switch to English":"Current language English. Switch to German"} onPress={()=>{const value=locale==='de'?'en':'de';void setLocale(value);void api('/api/profile',{method:'PATCH',body:JSON.stringify({locale:value})}).catch(()=>{})}} style={[{paddingHorizontal:12,paddingVertical:10,backgroundColor:'#151a1a',borderRadius:9,borderWidth:1,borderColor:'#2D3530'},!inline&&{position:'absolute',top:52,right:16,zIndex:100}]}><Text style={{color:'#e2ff57',fontFamily:"Manrope",fontSize:12}}>{locale==='de'?'DE':'EN'}</Text></Pressable>}
export function ExerciseName({exercise}:{exercise:{nameDe:string;nameEn?:string|null}}){const locale=useLocale();return <Text>{locale==='en'&&exercise.nameEn?exercise.nameEn:exercise.nameDe}</Text>}
export function LocalizedValue({value,format='toLocaleString',options}:{value:any;format?:string;options?:any}){const locale=useLocale();return <Text>{value?.[format]?.(locale==='en'?'en-GB':'de-DE',options)??''}</Text>}
