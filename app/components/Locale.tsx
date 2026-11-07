'use client';
import React,{createContext,useContext,useEffect,useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {Locale,translate} from '../../lib/i18n/translate';
const Context=createContext<{locale:Locale,timeZone:string,setLocale:(value:Locale)=>void}>({locale:'de',timeZone:'Europe/Berlin',setLocale:()=>{}});
export function LocaleProvider({initialLocale,timeZone,children}:{initialLocale:Locale,timeZone:string,children:React.ReactNode}){
 const [locale,update]=useState(initialLocale);
 const [,startTransition]=useTransition();
 const router=useRouter();
 useEffect(()=>{update(initialLocale);document.documentElement.lang=initialLocale},[initialLocale]);
 function setLocale(value:Locale){
  if(value===locale)return;
  update(value);
  document.documentElement.lang=value;
  document.cookie=`bd_locale=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
  fetch('/api/profile',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({locale:value})}).catch(()=>{});
  startTransition(()=>router.refresh());
 }
 return <Context.Provider value={{locale,timeZone,setLocale}}>{children}<LanguagePicker/></Context.Provider>;
}
export function LanguagePicker({inDrawer=false}:{inDrawer?:boolean}){
 const {locale,setLocale}=useContext(Context);
 const label=locale==='de'?'Sprache':'Language';
 return <label className={inDrawer?"language-picker drawer-language":"language-picker language-picker--page"}>
  {inDrawer&&<span>{label}</span>}
  <select aria-label={label} value={locale} onChange={e=>setLocale(e.target.value as Locale)}>
   <option value="de" lang="de">Deutsch</option>
   <option value="en" lang="en">English</option>
  </select>
 </label>;
}
export function useLocale(){return useContext(Context).locale}
export function useT(){const locale=useLocale();return (text:string)=>translate(text,locale)}
export function Copy({text}:{text:React.ReactNode}){const locale=useLocale();return <>{Array.isArray(text)?text.map((item,i)=><React.Fragment key={i}>{typeof item==='string'?translate(item,locale):item}</React.Fragment>):typeof text==='string'?translate(text,locale):text}</>}
type ElementProps=Omit<React.HTMLAttributes<HTMLElement>,"onChange">&{as:string;onChange?:React.ChangeEventHandler<HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement>;[key:string]:any};
export function LocalizedElement({as,...props}:ElementProps){const locale=useLocale();for(const key of ['placeholder','title','alt','aria-label'])if(typeof props[key]==='string')props[key]=translate(props[key],locale);return React.createElement(as,props)}
export function ExerciseName({exercise}:{exercise:{nameDe:string;nameEn?:string|null}}){const locale=useLocale();return <>{locale==='en'&&exercise.nameEn?exercise.nameEn:exercise.nameDe}</>}
export function LocalizedValue({value,format='toLocaleString',options}:{value:any;format?:string;options?:any}){
 const {locale,timeZone}=useContext(Context);
 const formatting=value instanceof Date?{timeZone,...options}:options;
 return <>{value?.[format]?.(locale==='en'?'en-GB':'de-DE',formatting)??''}</>;
}
