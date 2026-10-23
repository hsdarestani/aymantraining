import english from './en.json';
export type Locale='de'|'en';
const catalog:Record<string,string>=english;
export function translate(text:string,locale:Locale):string{
 if(locale==='de')return text;
 const trimmed=text.trim(),value=catalog[trimmed];
 if(value!==undefined)return text.replace(trimmed,value);

 if(trimmed.includes(' | '))return text.replace(trimmed,()=>trimmed.split(' | ').map(part=>translate(part,locale)).join(' | '));
 const detail=trimmed.match(/^(.*): (Ein fachlich freigegebener Abschlusstest ist erforderlich\.|Mindestens ein Trainingskapitel erforderlich\.|Mindestens ein Kapitelinhalt erforderlich\.|Schriftliche Anleitung für FREE fehlt\.|Übungsbild für FREE fehlt\.|PRO Erklärvideo fehlt\.)$/);
 if(detail&&catalog[detail[2]])return text.replace(trimmed,()=>detail[1]+': '+catalog[detail[2]]);
 const patterns:[RegExp,(...parts:string[])=>string][]=[
  [/^Veröffentlicht\. (\d+) offene Zielkombinationen vorgemerkt\.$/,(_,n)=>`Published. ${n} pending goal combinations matched.`],
  [/^Test bestanden: Level (.+) freigeschaltet\.$/,(_,level)=>`Test passed: level ${level} unlocked.`],
  [/^Test bestanden: nächstes Kapitel freigeschaltet\.$/,()=>"Test passed: next chapter unlocked."],
  [/^Einstieg freigegeben\. Erstes Kapitel: (.+)$/,(_,id)=>`Starting level approved. First chapter: ${id}`],
  [/^REGENERATION (\d+|Keine Angabe)$/,(_,a)=>`RECOVERY ${a==='Keine Angabe'?'No data':a}`],
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
