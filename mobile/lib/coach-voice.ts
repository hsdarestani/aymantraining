import {useCallback,useEffect,useRef,useState} from "react";
import {useFocusEffect} from "expo-router";
import {AppState} from "react-native";
import {useAudioPlayer} from "expo-audio";
import * as FileSystem from "expo-file-system";
import {api,API} from "./api";
import {getSession} from "./session";
import {useLocale} from "./i18n/locale";
type Category="WARM_UP"|"MOTIVATION"|"COOL_DOWN";
type Item={id:string;title:string;category:Category;mime:string};
export function useCoachVoice(category?:Category){
 const locale=useLocale(),player=useAudioPlayer(null);
 const [enabled,setEnabled]=useState(false),[ready,setReady]=useState(false),[item,setItem]=useState<Item|null>(null),[error,setError]=useState(false);
 const gen=useRef(0),file=useRef<string|null>(null);
 const stop=useCallback(()=>{gen.current++;try{player.pause()}catch{}const old=file.current;file.current=null;if(old)void FileSystem.deleteAsync(old,{idempotent:true}).catch(()=>{});},[player]);
 useFocusEffect(useCallback(()=>{let alive=true;setReady(false);setItem(null);setError(false);
  Promise.all([api<{enabled:boolean}>("/api/voice-preference"),category?api<{items:Item[]}>("/api/voice-guidance?playback=1&locale="+locale):Promise.resolve({items:[] as Item[]})]).then(([pref,library])=>{if(alive){setEnabled(pref.enabled===true);setItem(library.items.find(x=>x.category===category)||null);setReady(true)}}).catch(()=>{if(alive){setEnabled(false);setError(true)}});
  return()=>{alive=false;stop()};
 },[category,locale,stop]));
 useEffect(()=>{const sub=AppState.addEventListener("change",state=>{if(state!=="active")stop()});return()=>sub.remove()},[stop]);
 async function change(value:boolean){if(!value){stop();setEnabled(false)}setReady(false);setError(false);try{await api("/api/voice-preference",{method:"PATCH",body:JSON.stringify({enabled:value})});setEnabled(value)}catch{setError(true)}finally{setReady(true)}}
 async function play(){if(!enabled||!item)return;stop();const current=++gen.current;let dest:string|undefined;setError(false);
  try{const token=await getSession();if(!token||!FileSystem.cacheDirectory)throw Error();if(current!==gen.current)return;
   dest=FileSystem.cacheDirectory+"bd-coach-"+Date.now()+"-"+Math.random().toString(36).slice(2)+(item.mime==="audio/mpeg"?".mp3":".m4a");
   const result=await FileSystem.downloadAsync(API+"/api/voice-guidance?id="+encodeURIComponent(item.id),dest,{headers:{Authorization:"Bearer "+token}});
   if(result.status!==200||current!==gen.current){await FileSystem.deleteAsync(dest,{idempotent:true});if(current===gen.current)setError(true);return}
   file.current=dest;player.replace(dest);player.play();
  }catch{if(dest)void FileSystem.deleteAsync(dest,{idempotent:true}).catch(()=>{});if(current===gen.current)setError(true)}
 }
 return {enabled,ready,item,error,change,play,stop,locale};
}
