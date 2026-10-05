import {useSyncExternalStore} from 'react';
import * as SecureStore from 'expo-secure-store';
import english from './en.json';
export type Locale='de'|'en';
let locale:Locale='de';const listeners=new Set<()=>void>();
export function currentLocale(){return locale}
export function translate(text:string){if(locale==='de')return text;const trimmed=text.trim(),value=(english as Record<string,string>)[trimmed];if(value!==undefined)return text.replace(trimmed,value);

 const patterns:[RegExp,(...parts:string[])=>string][]=[
  [/^Training (\d+) von (\d+)$/,(_,a,b)=>`Workouts ${a} of ${b}`],
  [/^Training (\d+)\/(\d+)$/,(_,a,b)=>`Workouts ${a}/${b}`],
  [/^Leistungswert ([+-]?\d+) Prozent$/,(_,a)=>`Performance score ${a} percent`],
  [/^Leistungswert ([+-]?\d+)%$/,(_,a)=>`Performance score ${a}%`],
  [/^Beständigkeit (\d+|Keine Angabe)$/,(_,a)=>`Consistency ${a==='Keine Angabe'?'Not available':a}`],
  [/^Regeneration (\d+|Keine Angabe)$/,(_,a)=>`Recovery ${a==='Keine Angabe'?'Not available':a}`],
  [/^Schlaf im Schnitt (\d+(?:[.,]\d+)? Stunden|Keine Angabe)$/,(_,a)=>`Average sleep ${a==='Keine Angabe'?'Not available':a.replace(' Stunden',' hours')}`],
  [/^Schlaf Ø (\d+(?:[.,]\d+)?|Keine Angabe) h$/,(_,a)=>`Average sleep ${a==='Keine Angabe'?'Not available':a+' h'}`]
 ];
 for(const [pattern,format] of patterns){const match=trimmed.match(pattern);if(match)return text.replace(trimmed,format(...match))}
return text}

export function useLocale(){return useSyncExternalStore(cb=>{listeners.add(cb);return ()=>listeners.delete(cb)},()=>locale,()=>locale)}
export async function setLocale(value:Locale){locale=value;listeners.forEach(cb=>cb());await SecureStore.setItemAsync('bd_locale',value)}
export async function restoreLocale(){const value=await SecureStore.getItemAsync('bd_locale');if(value==='en'||value==='de'){locale=value;listeners.forEach(cb=>cb())}}
