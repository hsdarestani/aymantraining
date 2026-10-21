"use client";
import {Copy} from "../components/Locale";


import {useMemo,useState} from "react";
import "./journey.css";

const journeyEnabled=process.env.NEXT_PUBLIC_JOURNEY_ONBOARDING_ENABLED==="true";
const levelCards=[
  {code:"READY",label:"READY",description:"Du startest gerade oder steigst wieder ein. Du möchtest Grundlagen aufbauen und Schritt für Schritt in eine Trainingsroutine finden."},
  {code:"AWAKE",label:"AWAKE",description:"Du hast erste Trainingserfahrung und kennst grundlegende Übungen. Du möchtest regelmäßiger und strukturierter trainieren."},
  {code:"DIFFERENT",label:"DIFFERENT",description:"Du trainierst bereits regelmäßig und beherrschst die Grundlagen. Jetzt möchtest du gezielt an deinen ausgewählten Zielen arbeiten."},
  {code:"BE_DIFFERENT",label:"BE DIFFERENT",description:"Du trainierst fortgeschritten und strukturiert. Du suchst anspruchsvollere Inhalte und möchtest deine Leistung gezielt weiterentwickeln."},
  {code:"TRULY_DIFFERENT",label:"TRULY DIFFERENT",description:"Du verfügst über umfangreiche Trainingserfahrung und ein hohes Niveau in deinem gewählten Trainingsweg. Du möchtest anspruchsvolle Herausforderungen meistern und deine Leistung weiter verfeinern."}
] as const;

const goals=["Muskelaufbau","Fettabbau","Athletik","Fußball","Calisthenics","Gesundheit"];

function ageFromBirth(value:string){
  if(!value)return null;
  const birth=new Date(value+"T00:00:00");
  if(Number.isNaN(birth.getTime()))return null;
  const now=new Date();
  let age=now.getFullYear()-birth.getFullYear();
  const m=now.getMonth()-birth.getMonth();
  if(m<0||(m===0&&now.getDate()<birth.getDate()))age--;
  return age;
}

function Stepper({label,value,onChange,min,max,step=1,unit}:{label:string;value:number;onChange:(v:number)=>void;min:number;max:number;step?:number;unit?:string}){
  const clamp=(v:number)=>Math.min(max,Math.max(min,Math.round(v/step)*step));
  return <div className="stepper-field">
    <span><Copy text={label}/></span>
    <div className="stepper-control">
      <button type="button" onClick={()=>onChange(clamp(value-step))} aria-label={label+" verringern"}>−</button>
      <strong>{Number.isInteger(value)?value:value.toFixed(1)}{unit?<small>{unit}</small>:null}</strong>
      <button type="button" onClick={()=>onChange(clamp(value+step))} aria-label={label+" erhöhen"}>+</button>
    </div>
  </div>;
}

export default function Onboarding(){
  const [step,setStep]=useState(1);
  const [goal,setGoal]=useState("Athletik");
  const [selectedGoals,setSelectedGoals]=useState<string[]>(["Athletik"]);
  const [selfLevel,setSelfLevel]=useState<(typeof levelCards)[number]["code"]|null>(null);
  const [womenDashboard,setWomenDashboard]=useState(false);
  const healthStep=journeyEnabled?5:4;
  const testStep=journeyEnabled?6:5;
  const finalStep=journeyEnabled?7:6;
  const [health,setHealth]=useState(false);
  const [privacy,setPrivacy]=useState(false);
  const [terms,setTerms]=useState(false);
  const [birthDate,setBirthDate]=useState("");
  const [sex,setSex]=useState("prefer_not_to_say");
  const [height,setHeight]=useState(180);
  const [weight,setWeight]=useState(80);
  const [trainingExperience,setTrainingExperience]=useState<"STARTER"|"REGULAR"|"ADVANCED">("STARTER");
  const [availabilityPerWeek,setAvailabilityPerWeek]=useState(3);
  const [pushups,setPushups]=useState(20);
  const [plank,setUnterarmstütz]=useState(60);
  const [run,setRun]=useState<number|null>(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  const age=useMemo(()=>ageFromBirth(birthDate),[birthDate]);

  function validate(current:number){
    setError("");
    if(current===1&&(!privacy||!terms)){
      setError("Bitte bestätige Datenschutz und Nutzungsbedingungen.");
      return false;
    }
    if(current===2&&journeyEnabled&&selectedGoals.length===0){setError("Wähle mindestens ein Trainingsziel.");return false;}
    if(current===4&&journeyEnabled&&!selfLevel){setError("Bitte schätze dein Einstiegslevel ein.");return false;}
    if(current===3){
      if(!birthDate){setError("Bitte wähle dein Geburtsdatum.");return false;}
      if(age==null){setError("Geburtsdatum ist ungültig.");return false;}
      if(age<16){setError("BE DIFFERENT ist zum Launch ab 16 Jahren verfügbar.");return false;}
      if(height<120||height>230){setError("Bitte prüfe deine Körpergröße.");return false;}
      if(weight<35||weight>250){setError("Bitte prüfe dein Gewicht.");return false;}
    }
    return true;
  }

  function next(){
    if(!validate(step))return;
    setStep(Math.min(finalStep,step+1));
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function back(){
    setError("");
    setStep(Math.max(1,step-1));
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function finish(){
    if(!validate(3))return;
    setBusy(true);setError("");
    try{
      const r=await fetch("/api/onboarding/complete",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
        goal:journeyEnabled?selectedGoals[0]:goal,
        ...(journeyEnabled?{goals:selectedGoals,selfLevel,dashboard:womenDashboard&&sex==="female"?"WOMEN":"GENERAL"}:{}),
        birthDate,sex,heightCm:height,weightKg:weight,trainingExperience,availabilityPerWeek,healthConsent:health,privacyConsent:privacy,termsConsent:terms,
        pushups,plankSeconds:plank,run5kMinutes:run??undefined
      })});
      const j=await r.json().catch(()=>({}));
      if(!r.ok){setError(j.error||"Onboarding konnte nicht abgeschlossen werden.");return;}
      location.href="/pricing?onboarding=1";
    }catch{
      setError("Verbindung fehlgeschlagen. Bitte versuche es erneut.");
    }finally{setBusy(false);}
  }

  return <main className="onboard-shell">
    <div className="onboard-brand">BE <span>DIFFERENT</span></div>
    <section className="onboard-card">
      <div className="steps">{Array.from({length:finalStep},(_,i)=>i+1).map(n=><i key={n} className={n<step?"done":n===step?"active":""}/>)}</div>
      <span className="eyebrow"><Copy text={"SCHRITT"}/>{String(step).padStart(2,"0")} / {String(finalStep).padStart(2,"0")}</span>

      {step===1&&<>
        <h1><Copy text={"Normal ist langweilig."}/></h1>
        <p><Copy text={"BE DIFFERENT verbindet Training, Regeneration und persönliche Trainerbetreuung. Empfehlungen sind Training und Lifestyle, keine medizinische Diagnose."}/></p>
        <label className="consent-line"><input type="checkbox" checked={privacy} onChange={e=>{setPrivacy(e.target.checked);setError("")}}/><Copy text={"Datenschutzinformationen gelesen und akzeptiert"}/></label>
        <label className="consent-line"><input type="checkbox" checked={terms} onChange={e=>{setTerms(e.target.checked);setError("")}}/><Copy text={"Nutzungsbedingungen akzeptiert"}/></label>
      </>}

      {step===2&&<>
        <h1><Copy text={"Was willst du verändern?"}/></h1>
        <p>{journeyEnabled?"Du kannst mehrere Ziele kombinieren. Dein Coach stellt daraus einen zusammenhängenden Trainingsweg zusammen.":"Wähle deinen Trainingsfokus."}</p>
        <div className="goals">{goals.map(x=>{const selected=journeyEnabled?selectedGoals.includes(x):goal===x;return <button type="button" aria-pressed={selected} key={x} className={selected?"selected":""} onClick={()=>journeyEnabled?setSelectedGoals(old=>old.includes(x)?old.filter(g=>g!==x):[...old,x]):setGoal(x)}><span>{x}</span><b>{selected?"✓":"+"}</b></button>})}</div>
        {journeyEnabled&&<p className="journey-note">DEIN WEG: {selectedGoals.length?selectedGoals.join(" + "):"Bitte Ziele auswählen"}<br/>Wenn diese Kombination noch nicht hinterlegt ist, bleibt deine Anfrage zur Zuordnung gespeichert. Es wird kein Trainingsplan erfunden.</p>}
      </>}

      {step===3&&<>
        <h1><Copy text={"Deine Basis."}/></h1>
        <p><Copy text={"Einmal auswählen statt tippen. Wir nutzen diese Daten für deine persönliche Baseline."}/></p>
        <div className="mobile-field">
          <label><Copy text={"Geburtsdatum"}/></label>
          <input className={age!=null&&age<16?"invalid":""} type="date" value={birthDate} onChange={e=>{setBirthDate(e.target.value);setError("")}}/>
          {age!=null&&<small className={age<16?"field-error":"field-ok"}><Copy text={age<16?"Mindestens 16 Jahre erforderlich":age+" Jahre"}/></small>}
        </div>
        <div className="segmented-field">
          <label><Copy text={"Geschlecht"}/></label>
          <div>{[["male","Männlich"],["female","Weiblich"],["diverse","Divers"],["prefer_not_to_say","Keine Angabe"]].map(([value,label])=><button type="button" key={value} className={sex===value?"selected":""} onClick={()=>{setSex(value);if(value!=="female")setWomenDashboard(false)}}>{label}</button>)}</div>
        </div>
        {journeyEnabled&&sex==="female"&&<div className="journey-dashboard-choice"><strong>OPTIONALE STARTANSICHT</strong><p>Du kannst das Frauen-Dashboard oder die allgemeine Ansicht wählen. Alle Sportarten bleiben offen.</p><label><input type="checkbox" checked={womenDashboard} onChange={e=>setWomenDashboard(e.target.checked)}/> Frauen-Dashboard als Startansicht vormerken</label></div>}
        <div className="stepper-grid">
          <Stepper label="Größe" value={height} onChange={v=>{setHeight(v);setError("")}} min={120} max={230} unit=" cm"/>
          <Stepper label="Gewicht" value={weight} onChange={v=>{setWeight(v);setError("")}} min={35} max={250} step={0.5} unit=" kg"/>
        </div>
      </>}

      {journeyEnabled&&step===4&&<>
        <h1>Wo stehst du?</h1><p>Schätze dich passend zu deiner Zielkombination ein. Ein höheres Level wird erst nach einem Einstufungstest oder einer Bestätigung durch den Coach freigeschaltet.</p>
        <div className="journey-selected">DEIN WEG: {selectedGoals.join(" + ")}</div>
        <div className="journey-levels">{levelCards.map(level=><button type="button" aria-pressed={selfLevel===level.code} className={selfLevel===level.code?"journey-level selected":"journey-level"} key={level.code} onClick={()=>setSelfLevel(level.code)}><strong>{level.label}</strong><span>{level.description}</span><b>{selfLevel===level.code?"✓":"○"}</b></button>)}</div>
        <p className="journey-note">Deine Selbsteinschätzung öffnet noch keine Kapitel. Der genaue Einstufungstest und die Kriterien werden vom Coach festgelegt.</p>
      </>}

      {step===healthStep&&<>
        <h1><Copy text={"Gesundheitsdaten verbinden."}/></h1>
        <p><Copy text={"Gesundheitsdaten werden nur nach ausdrücklicher Einwilligung verarbeitet und nicht für Werbung verwendet."}/></p>
        <button type="button" className={health?"health-choice selected":"health-choice"} onClick={()=>setHealth(!health)}>
          <span><b>{health?"✓":"+"}</b><strong><Copy text={"Gesundheitsdaten verwenden"}/></strong></span>
          <small><Copy text={"Schlaf · HRV · Ruhepuls · Schritte · VO2max · Workouts · Gewicht"}/></small>
        </button>
        <p className="optional-note"><Copy text={"Optional. Du kannst das später jederzeit in Einstellungen verbinden."}/></p>
      </>}

      {step===testStep&&<>
        <h1><Copy text={"Kurzer Starttest."}/></h1>
        <p><Copy text={"Kein Tippen nötig. Passe die Werte einfach mit + und − an."}/></p>
        <div className="stepper-stack">
          <Stepper label="Liegestütze" value={pushups} onChange={setPushups} min={0} max={300}/>
          <Stepper label="Unterarmstütz" value={plank} onChange={setUnterarmstütz} min={0} max={1800} step={5} unit=" Sek."/>
          <div className="optional-stepper">
            <div className="optional-head"><span><Copy text={"5 km Lauf"}/></span><button type="button" onClick={()=>setRun(run==null?30:null)}><Copy text={run==null?"HINZUFÜGEN":"+ ENTFERNEN"}/></button></div>
            {run!=null&&<Stepper label="Zeit" value={run} onChange={setRun} min={10} max={120} step={0.5} unit=" Min."/>}
            {run==null&&<small><Copy text={"Optional. Nur hinzufügen, wenn du einen aktuellen Wert kennst."}/></small>}
          </div>
        </div>
      </>}

      {step===finalStep&&<>
        <div className="first-score"><span className="eyebrow"><Copy text={"BEREIT"}/></span><strong>100%</strong><b><Copy text={"EINRICHTUNG"}/></b></div>
        <h1><Copy text={"Jetzt beginnt die Entwicklung."}/></h1>
        {journeyEnabled&&<div className="journey-note"><strong>Deine Selbsteinschätzung: {selfLevel?.replaceAll("_"," ")}</strong><p>Dein tatsächliches Einstiegslevel wird erst durch den Coach oder einen freigegebenen Einstufungstest bestätigt. Falls deine Zielkombination noch nicht fertig ist, bleibt sie für die Zuordnung vorgemerkt. PRO überspringt keine Tests.</p></div>}
        <p><Copy text={"Der erste echte Leistungswert wird aus deinen gespeicherten Daten berechnet. Fehlende Werte werden nicht erfunden."}/></p>
      </>}

      {error&&<div className="form-error onboard-error"><Copy text={error}/></div>}

      <div className="onboard-actions sticky-actions">
        {step>1?<button type="button" className="back-button" onClick={back}><Copy text={"ZURÜCK"}/></button>:<span/>}
        {step<finalStep?<button type="button" className="primary" onClick={next}><Copy text={"WEITER →"}/></button>:<button type="button" className="primary" onClick={finish} disabled={busy}><Copy text={busy?"SPEICHERN…":"EINRICHTUNG ABSCHLIESSEN →"}/></button>}
      </div>
    </section>
  </main>;
}
