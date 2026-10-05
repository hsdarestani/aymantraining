'use client';
import React,{createContext,useContext,useState} from 'react';
import {Locale,translate} from '../../lib/i18n/translate';
const Context=createContext<{locale:Locale,setLocale:(value:Locale)=>void}>({locale:'de',setLocale:()=>{}});
export function LocaleProvider({initialLocale,children}:{initialLocale:Locale,children:React.ReactNode}){
 const [locale,update]=useState(initialLocale);
 function setLocale(value:Locale){update(value);document.documentElement.lang=value;document.cookie=`bd_locale=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;fetch('/api/profile',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({locale:value})}).catch(()=>{});}
 return <Context.Provider value={{locale,setLocale}}>{children}<label className="language-picker" aria-label="Language"><select aria-label="Language" value={locale} onChange={e=>setLocale(e.target.value as Locale)}><option value="de">Deutsch</option><option value="en">English</option></select></label></Context.Provider>;
}
export function useLocale(){return useContext(Context).locale}
export function Copy({text}:{text:React.ReactNode}){const locale=useLocale();return <>{Array.isArray(text)?text.map((item,i)=><React.Fragment key={i}>{typeof item==='string'?translate(item,locale):item}</React.Fragment>):typeof text==='string'?translate(text,locale):text}</>}
type ElementProps=Omit<React.HTMLAttributes<HTMLElement>,"onChange">&{as:string;onChange?:React.ChangeEventHandler<HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement>;[key:string]:any};
export function LocalizedElement({as,...props}:ElementProps){const locale=useLocale();for(const key of ['placeholder','title','alt','aria-label'])if(typeof props[key]==='string')props[key]=translate(props[key],locale);return React.createElement(as,props)}
export function ExerciseName({exercise}:{exercise:{nameDe:string;nameEn?:string|null}}){const locale=useLocale();return <>{locale==='en'&&exercise.nameEn?exercise.nameEn:exercise.nameDe}</>}
export function LocalizedValue({value,format='toLocaleString',options}:{value:any;format?:string;options?:any}){const locale=useLocale();return <>{value?.[format]?.(locale==='en'?'en-GB':'de-DE',options)??''}</>}
