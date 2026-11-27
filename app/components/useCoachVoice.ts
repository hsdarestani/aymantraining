"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {useLocale} from "./Locale";
type Category="WARM_UP"|"MOTIVATION"|"COOL_DOWN";
type Item={id:string;url:string;title:string;category:Category};
export function useCoachVoice(category?:Category){
 const locale=useLocale(),[enabled,setEnabled]=useState(false),[ready,setReady]=useState(false),[item,setItem]=useState<Item|null>(null),[error,setError]=useState(false);
 const audio=useRef<HTMLAudioElement|null>(null),generation=useRef(0);
 const stop=useCallback(()=>{generation.current++;audio.current?.pause();if(audio.current){audio.current.removeAttribute("src");audio.current.load();audio.current=null;}},[]);
 useEffect(()=>{let alive=true;setReady(false);setItem(null);stop();
  Promise.all([fetch("/api/voice-preference",{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error();return r.json()}),category?fetch("/api/voice-guidance?playback=1&locale="+locale,{cache:"no-store"}).then(async r=>r.ok?r.json():{items:[]}):Promise.resolve({items:[]})]).then(([pref,data])=>{if(alive){setEnabled(pref.enabled===true);setItem(data.items.find((x:Item)=>x.category===category)||null);setReady(true);}}).catch(()=>{if(alive)setError(true)});
  return()=>{alive=false;stop()};
 },[category,locale,stop]);
 useEffect(()=>{const hide=()=>{if(document.hidden)stop()};document.addEventListener("visibilitychange",hide);return()=>document.removeEventListener("visibilitychange",hide)},[stop]);
 async function change(value:boolean){if(!value){stop();setEnabled(false)}setReady(false);setError(false);try{const r=await fetch("/api/voice-preference",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({enabled:value})});if(!r.ok)throw Error();setEnabled(value);}catch{setError(true)}finally{setReady(true)}}
 function play(){if(!enabled||!item)return;stop();const current=++generation.current;const a=new Audio("/api/voice-guidance?id="+encodeURIComponent(item.id));audio.current=a;setError(false);a.onerror=()=>{if(generation.current===current)setError(true)};void a.play().catch(()=>{if(generation.current===current)setError(true)});}
 return {enabled,ready,item,error,change,play,stop,locale};
}
