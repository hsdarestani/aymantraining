import {useSyncExternalStore} from 'react';
import * as SecureStore from 'expo-secure-store';
import english from './en.json';
export type Locale='de'|'en';
let locale:Locale='de';const listeners=new Set<()=>void>();
export function currentLocale(){return locale}
export function translate(text:string){if(locale==='de')return text;const key=text.trim(),result=(english as Record<string,string>)[key];return result===undefined?text:text.replace(key,result)}
export function useLocale(){return useSyncExternalStore(cb=>{listeners.add(cb);return ()=>listeners.delete(cb)},()=>locale,()=>locale)}
export async function setLocale(value:Locale){locale=value;listeners.forEach(cb=>cb());await SecureStore.setItemAsync('bd_locale',value)}
export async function restoreLocale(){const value=await SecureStore.getItemAsync('bd_locale');if(value==='en'||value==='de'){locale=value;listeners.forEach(cb=>cb())}}
