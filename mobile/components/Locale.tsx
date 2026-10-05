import React from 'react';
import {Text,TextInput,TextInputProps,Pressable} from 'react-native';
import {useLocale,translate,setLocale} from '../lib/i18n/locale';
import {api} from '../lib/api';
export function Copy({text}:{text:React.ReactNode}){useLocale();return <Text>{typeof text==='string'?translate(text):text}</Text>}
export const LocalizedTextInput=React.forwardRef<TextInput,TextInputProps>((props,ref)=>{useLocale();return <TextInput {...props} ref={ref} placeholder={props.placeholder?translate(props.placeholder):undefined} accessibilityLabel={props.accessibilityLabel?translate(props.accessibilityLabel):undefined}/>});
LocalizedTextInput.displayName='LocalizedTextInput';
export function LanguagePicker(){const locale=useLocale();return <Pressable accessibilityRole="button" accessibilityLabel="Change language" onPress={()=>{const value=locale==='de'?'en':'de';void setLocale(value);void api('/api/profile',{method:'PATCH',body:JSON.stringify({locale:value})}).catch(()=>{})}} style={{position:'absolute',top:52,right:16,zIndex:100,padding:8,backgroundColor:'#151a1a',borderRadius:8}}><Text style={{color:'#e2ff57',fontSize:12}}>{locale==='de'?'EN':'DE'}</Text></Pressable>}
export function ExerciseName({exercise}:{exercise:{nameDe:string;nameEn?:string|null}}){const locale=useLocale();return <Text>{locale==='en'&&exercise.nameEn?exercise.nameEn:exercise.nameDe}</Text>}
export function LocalizedValue({value,format='toLocaleString',options}:{value:any;format?:string;options?:any}){const locale=useLocale();return <Text>{value?.[format]?.(locale==='en'?'en-GB':'de-DE',options)??''}</Text>}
