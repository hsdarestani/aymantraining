"use client";

import {useCallback, useEffect, useRef, useState, type FormEvent} from "react";
import {Copy, LocalizedElement, LocalizedValue, useT} from "../components/Locale";

type Message = {id:string;senderId:string;text:string|null;mediaId:string|null;kind:"TEXT"|"VOICE"|"VIDEO";createdAt:Date|string};
type Payload = {text?:string;mediaId?:string;kind?:"TEXT"|"VOICE"|"VIDEO";durationSec?:number};

function mergeMessages(previous: Message[], incoming: Message[]) {
  const byId = new Map(previous.map(message => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a,b) => +new Date(a.createdAt)-+new Date(b.createdAt) || a.id.localeCompare(b.id));
}

async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, {cache:"no-store", ...options});
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(data.error || "Verbindung fehlgeschlagen.");
  return data;
}

export default function CoachClient({userId, initial, initialCursor, canWrite}:{
  userId:string; initial:Message[]; initialCursor:string|null; canWrite:boolean;
}) {
  const t = useT();
  const [messages, setMessages] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<{file:File;kind:"VOICE"|"VIDEO";durationSec?:number}|null>(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const recordingRef = useRef<MediaRecorder|null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLOListElement>(null);
  const atLatest = useRef(true);
  const alive = useRef(false);
  const pending = useRef<{text:string;file:File|null;id:string;mediaId?:string}|null>(null);
  const initialized = useRef(initial.length > 0);

  const refresh = useCallback(async () => {
    const data = await request("/api/messages?recent=1");
    if (!alive.current) return;
    setMessages(old => mergeMessages(old,data.items));
    if (!initialized.current) {
      initialized.current = true;
      setCursor(data.nextCursor);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    function onVisible() {
      if (canWrite && document.visibilityState === "visible") void refresh().catch(() => {});
    }
    const timer = window.setInterval(onVisible, 20_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive.current = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      const recorder = recordingRef.current;
      if (recorder) {
        recorder.onstop = null;
        recorder.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [canWrite, refresh]);

  useEffect(() => {
    if (atLatest.current && log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages]);

  async function older() {
    if (!cursor || loadingHistory) return;
    setLoadingHistory(true);
    atLatest.current = false;
    setError("");
    try {
      const data = await request("/api/messages?recent=1&before="+encodeURIComponent(cursor)+(canWrite?"":"&athleteId="+encodeURIComponent(userId)));
      setMessages(old => mergeMessages(old,data.items));
      setCursor(data.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verbindung fehlgeschlagen.");
    } finally {
      setLoadingHistory(false);
    }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = text.trim();
    if (busy || recording || (!body && !attachment)) return;
    setBusy(true);
    setNotice("");
    setError("");
    const file = attachment?.file ?? null;
    if (!pending.current || pending.current.text !== body || pending.current.file !== file) {
      pending.current = {text:body,file,id:crypto.randomUUID()};
    }
    const draft = pending.current;
    try {
      if (attachment && !draft.mediaId) {
        const upload = new FormData();
        upload.set("file", attachment.file);
        upload.set("kind", attachment.kind === "VOICE" ? "VOICE_MESSAGE" : "TECHNIQUE_VIDEO");
        const data = await request("/api/media",{method:"POST",body:upload});
        draft.mediaId = data.asset.id;
      }
      const payload: Payload = {
        text:body || undefined, mediaId:draft.mediaId, kind:attachment?.kind ?? "TEXT", durationSec:attachment?.durationSec,
      };
      const data = await request("/api/messages",{
        method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...payload,clientId:draft.id}),
      });
      atLatest.current = true;
      setMessages(old => mergeMessages(old,[data.message]));
      setText("");
      setAttachment(null);
      pending.current = null;
      if (fileInput.current) fileInput.current.value = "";
      setNotice("Nachricht gesendet.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Senden fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  async function record() {
    if (recordingRef.current?.state === "recording") {
      recordingRef.current.stop();
      return;
    }
    setError("");
    setNotice("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Sprachaufnahmen sind in diesem Browser nicht verfügbar.");
      return;
    }
    let stream: MediaStream | undefined;
    setBusy(true);
    try {
      stream = await navigator.mediaDevices.getUserMedia({audio:true});
      if (!alive.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      const mime = ["audio/webm","audio/mp4","audio/ogg"].find(value => MediaRecorder.isTypeSupported(value));
      const recorder = mime ? new MediaRecorder(stream,{mimeType:mime}) : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      const started = Date.now();
      recorder.ondataavailable = event => {if(event.data.size)chunks.push(event.data);};
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach(track => track.stop());
        recordingRef.current = null;
        if (!alive.current) return;
        setRecording(false);
        const type = (recorder.mimeType || chunks[0]?.type || "audio/webm").split(";")[0];
        const extension = type.split("/")[1];
        const file = new File(chunks,"aufnahme."+extension,{type});
        if (!file.size) {
          setError("Die Aufnahme ist leer. Versuche es erneut.");
          return;
        }
        setAttachment({file,kind:"VOICE",durationSec:Math.min(3600,Math.round((Date.now()-started)/1000))});
      };
      recorder.start();
      recordingRef.current = recorder;
      setRecording(true);
    } catch {
      stream?.getTracks().forEach(track => track.stop());
      setError("Mikrofon konnte nicht geöffnet werden. Prüfe die Freigabe.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="bd-dialogue" id="coach-dialogue">
    <header><h2><Copy text="Euer Gespräch"/></h2><span className="bd-kicker"><Copy text="PRIVAT"/></span></header>
    {cursor && <button type="button" className="bd-text-link" disabled={loadingHistory} onClick={older}><Copy text="Ältere Nachrichten laden"/></button>}
    {messages.length ? <ol className="bd-dialogue-log" ref={log} aria-live="polite"
      onScroll={e=>{const area=e.currentTarget;atLatest.current=area.scrollHeight-area.clientHeight-area.scrollTop<24;}}>{messages.map(message => <li key={message.id} data-own={message.senderId===userId||undefined}>
      <div><strong><Copy text={message.senderId===userId?"Du":"Coach"}/></strong>
        <time><LocalizedValue value={new Date(message.createdAt)} options={{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}}/></time></div>
      {message.text && <p>{message.text}</p>}
      {message.mediaId && (message.kind==="VOICE" ?
        <audio controls preload="none" src={"/api/media/"+message.mediaId} aria-label={t("Sprachnachricht")}/> :
        message.kind==="VIDEO" && <video controls playsInline preload="none" src={"/api/media/"+message.mediaId} aria-label={t("Technikvideo")}/>)}
    </li>)}</ol> : <p><Copy text="Hier ist Platz für deine erste Frage."/></p>}
    {canWrite && <form className="bd-coach-composer" onSubmit={send}>
      <label>
        <span className="bd-kicker"><Copy text="DEINE NACHRICHT"/></span>
        <LocalizedElement as="textarea" value={text} rows={2} maxLength={4000} disabled={busy}
          onChange={e=>setText(e.target.value)} placeholder="Was möchtest du besprechen?"/>
      </label>
      {attachment && <div className="bd-attachment"><span><Copy text={attachment.kind==="VOICE"?"Sprachnachricht bereit":"Technikvideo bereit"}/></span>
        <button className="bd-text-link" disabled={busy||recording} type="button" onClick={()=>{setAttachment(null);if(fileInput.current)fileInput.current.value="";}}><Copy text="Entfernen"/></button></div>}
      <div className="bd-composer-actions">
        <button type="button" disabled={busy} className="bd-compose-option" aria-pressed={recording} onClick={record}><Copy text={recording?"Aufnahme beenden":"Sprache aufnehmen"}/></button>
        <input type="file" accept="video/mp4,video/quicktime,video/webm" ref={fileInput} hidden
          onChange={e=>{const file=e.target.files?.[0];if(file)setAttachment({file,kind:"VIDEO"});e.target.value="";}}/>
        <button type="button" className="bd-compose-option" disabled={busy||recording} onClick={()=>fileInput.current?.click()}><Copy text="Video hinzufügen"/></button>
        <button type="submit" className="bd-action" disabled={busy||recording||(!text.trim()&&!attachment)}><Copy text={busy?"Wird gesendet …":"Senden"}/></button>
      </div>
    </form>}
    {notice && <p role="status"><Copy text={notice}/></p>}
    {error && <p role="alert" className="bd-field-error"><Copy text={error}/></p>}
  </section>;
}
