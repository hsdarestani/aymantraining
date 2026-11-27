"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useLocale} from "../../components/Locale";
type AudioItem={id:string;title:string;category:string;audience:string;locale:string;active:boolean;url:string;originalName:string;size:number};
export default function AudioManager(){
 const lang=useLocale(),t=(de:string,en:string)=>lang==="de"?de:en;
 const [query,setQuery]=useState(""),[items,setItems]=useState<AudioItem[]>([]),[status,setStatus]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const categories=[["WARM_UP",t("Aufwärmen","Warm-up")],["MOTIVATION","Motivation"],["COOL_DOWN","Cool-down"]];
 const audiences=[["GENERAL",t("Alle","Everyone")],["MALE",t("Männlich","Male")],["FEMALE",t("Weiblich","Female")]];
 async function refresh(){try{const r=await fetch("/api/voice-guidance",{cache:"no-store"});const data=await r.json();if(!r.ok)throw new Error(data.error);setItems(data.items);}catch(e){setStatus(e instanceof Error?e.message:"Error");}finally{setLoading(false);}}
 useEffect(()=>{void refresh()},[]);
 async function submit(e:FormEvent<HTMLFormElement>,id?:string){
  e.preventDefault();const form=e.currentTarget,body=new FormData(form);
  body.set("active",body.get("active")==="on"?"true":"false");if(id)body.set("id",id);
  setBusy(true);setStatus("");
  try{const r=await fetch("/api/voice-guidance",{method:id?"PATCH":"POST",body});const data=await r.json();if(!r.ok)throw new Error(data.error||"Error");if(!id)form.reset();else {const file=form.elements.namedItem("file");if(file instanceof HTMLInputElement)file.value="";}await refresh();setStatus(t("Gespeichert.","Saved."));}catch(e){setStatus(e instanceof Error?e.message:"Error");}finally{setBusy(false);}
 }
 async function remove(item:AudioItem){
  if(!window.confirm(t("Diese Audiodatei wirklich löschen?","Delete this audio file?")))return;
  setBusy(true);setStatus("");try{const r=await fetch("/api/voice-guidance?id="+encodeURIComponent(item.id),{method:"DELETE"});const data=await r.json();if(!r.ok)throw new Error(data.error||"Error");await refresh();setStatus(t("Gelöscht.","Deleted."));}catch(e){setStatus(e instanceof Error?e.message:"Error");}finally{setBusy(false);}
 }
 const visible=items.filter(item=>[item.title,item.originalName,item.category,item.audience,item.locale].join(" ").toLowerCase().includes(query.toLowerCase().trim()));
 function fields(item?:AudioItem){return <>
 <label>{t("Titel","Title")}<input name="title" required maxLength={120} defaultValue={item?.title}/></label>
 <label>{t("Kategorie","Category")}<select name="category" defaultValue={item?.category||"MOTIVATION"}>{categories.map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
 <label>{t("Zielgruppe","Audience")}<select name="audience" defaultValue={item?.audience||"GENERAL"}>{audiences.map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
 <label>{t("Sprache","Language")}<select name="locale" defaultValue={item?.locale||"de"}><option value="de">Deutsch</option><option value="en">English</option></select></label>
 <label className="checkline"><input name="active" type="checkbox" defaultChecked={item?.active||false}/>{t("Aktiv","Active")}</label>
 </>}
 return <div style={{display:"grid",gap:16}}>
 <form className="panel settings-form-card" onSubmit={e=>void submit(e)}>
 <h2>{t("Audio hochladen","Upload audio")}</h2>{fields()}
 <label>{t("Audiodatei (MP3, M4A, MP4 · max. 25 MB)","Audio file (MP3, M4A, MP4 · max. 25 MB)")}<input name="file" type="file" accept=".mp3,.m4a,.mp4,audio/mpeg,audio/mp4,video/mp4" required/></label>
 <p className="muted">{t("Neue Audios sind standardmäßig inaktiv. Prüfe die Aufnahme vor der Aktivierung.","New audio is inactive by default. Preview the recording before activation.")}</p>
 <button className="primary compact" disabled={busy}>{t("HOCHLADEN","UPLOAD")}</button>
 </form>
 <p role="status" aria-live="polite">{status}</p>
 <h2>{t("Audiobibliothek","Audio library")} ({items.length})</h2>
 <label>{t("Audio suchen","Search audio")}<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("Titel oder Dateiname","Title or filename")}/></label>
 {loading?<p>{t("Wird geladen…","Loading…")}</p>:!items.length?<p>{t("Noch keine Audiodateien.","No audio files yet.")}</p>:!visible.length?<p>{t("Keine Treffer.","No matches.")}</p>:visible.map(item=><form key={item.id} className="panel settings-form-card" onSubmit={e=>void submit(e,item.id)}>
 <strong>{item.title}</strong><small>{item.originalName} · {(item.size/1048576).toFixed(1)} MB</small>
 <audio controls preload="none" src={item.url} style={{width:"100%"}}/>
 {fields(item)}<label>{t("Audiodatei ersetzen (optional)","Replace audio file (optional)")}<input name="file" type="file" accept=".mp3,.m4a,.mp4,audio/mpeg,audio/mp4,video/mp4"/></label><div style={{display:"flex",gap:12,flexWrap:"wrap"}}><button className="secondary" disabled={busy}>{t("ÄNDERUNGEN SPEICHERN","SAVE CHANGES")}</button><button type="button" className="secondary" disabled={busy} onClick={()=>void remove(item)}>{t("LÖSCHEN","DELETE")}</button></div></form>)}
 </div>;
}
