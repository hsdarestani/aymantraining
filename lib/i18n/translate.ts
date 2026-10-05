import english from './en.json';
export type Locale='de'|'en';
const catalog:Record<string,string>=english;
export function translate(text:string,locale:Locale){
 if(locale==='de')return text;
 const trimmed=text.trim(),value=catalog[trimmed];
 if(value!==undefined)return text.replace(trimmed,value);

 const patterns:[RegExp,(...parts:string[])=>string][]=[
  [/^(.*) · Tag (\d+)$/,(_,a,b)=>`${a} · Day ${b}`],
  [/^(\d+) Übungen importiert(?: · (\d+) Hinweise)?\.$/,(_,a,b)=>`${a} exercises imported${b?` · ${b} notices`:""}.`],
  [/^Training (\d+) von (\d+)$/,(_,a,b)=>`Workouts ${a} of ${b}`],
  [/^Training (\d+)\/(\d+)$/,(_,a,b)=>`Workouts ${a}/${b}`],
  [/^Leistungswert ([+-]?\d+) Prozent$/,(_,a)=>`Performance score ${a} percent`],
  [/^Leistungswert ([+-]?\d+)%$/,(_,a)=>`Performance score ${a}%`],
  [/^Beständigkeit (\d+|Keine Angabe)$/,(_,a)=>`Consistency ${a==='Keine Angabe'?'Not available':a}`],
  [/^Regeneration (\d+|Keine Angabe)$/,(_,a)=>`Recovery ${a==='Keine Angabe'?'Not available':a}`],
  [/^Schlaf im Schnitt (\d+(?:[.,]\d+)? Stunden|Keine Angabe)$/,(_,a)=>`Average sleep ${a==='Keine Angabe'?'Not available':a.replace(' Stunden',' hours')}`],
  [/^Schlaf Ø (\d+(?:[.,]\d+)?|Keine Angabe) h$/,(_,a)=>`Average sleep ${a==='Keine Angabe'?'Not available':a+' h'}`]
 ];
 for(const [pattern,format] of patterns){const match=trimmed.match(pattern);if(match)return text.replace(trimmed,()=>format(...match))}
 return text;
}
export function language(value:unknown):Locale{return value==='en'?'en':'de'}
