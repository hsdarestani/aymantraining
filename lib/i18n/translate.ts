import english from './en.json';
export type Locale='de'|'en';
const catalog:Record<string,string>=english;
export function translate(text:string,locale:Locale){
 if(locale==='de')return text;
 const trimmed=text.trim(),value=catalog[trimmed];
 if(value!==undefined)return text.replace(trimmed,value);
 return text;
}
export function language(value:unknown):Locale{return value==='en'?'en':'de'}
