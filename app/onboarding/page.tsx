"use client";

import {useMemo,useState} from "react";

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
    <span>{label}</span>
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
  const [health,setHealth]=useState(false);
  const [privacy,setPrivacy]=useState(false);
  const [terms,setTerms]=useState(false);
  const [birthDate,setBirthDate]=useState("");
  const [sex,setSex]=useState("prefer_not_to_say");
  const [height,setHeight]=useState(180);
  const [weight,setWeight]=useState(80);\n  const [trainingExperience,setTrainingExperience]=useState<"STARTER"|"REGULAR"|"ADVANCED">("STARTER");\n  const [availabilityPerWeek,setAvailabilityPerWeek]=useState(3);
  const [pushups,setPushups]=useState(20);
  const [plank,setPlank]=useState(60);
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
    setStep(Math.min(6,step+1));
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
        goal,birthDate,sex,heightCm:height,weightKg:weight,trainingExperience,availabilityPerWeek,healthConsent:health,privacyConsent:privacy,termsConsent:terms,
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
      <div className="steps">{[1,2,3,4,5,6].map(n=><i key={n} className={n<step?"done":n===step?"active":""}/>)}</div>
      <span className="eyebrow">STEP {String(step).padStart(2,"0")} / 06</span>

      {step===1&&<>
        <h1>Normal is boring.</h1>
        <p>BE DIFFERENT verbindet Training, Recovery und persönliche Coach Begleitung. Empfehlungen sind Training und Lifestyle, keine medizinische Diagnose.</p>
        <label className="consent-line"><input type="checkbox" checked={privacy} onChange={e=>{setPrivacy(e.target.checked);setError("")}}/> Datenschutzinformationen gelesen und akzeptiert</label>
        <label className="consent-line"><input type="checkbox" checked={terms} onChange={e=>{setTerms(e.target.checked);setError("")}}/> Nutzungsbedingungen akzeptiert</label>
      </>}

      {step===2&&<>
        <h1>Was willst du verändern?</h1>
        <div className="goals">{goals.map(x=><button type="button" key={x} className={goal===x?"selected":""} onClick={()=>setGoal(x)}><span>{x}</span><b>{goal===x?"✓":"→"}</b></button>)}</div>
      </>}

      {step===3&&<>
        <h1>Deine Basis.</h1>
        <p>Einmal auswählen statt tippen. Wir nutzen diese Daten für deine persönliche Baseline.</p>
        <div className="mobile-field">
          <label>Geburtsdatum</label>
          <input className={age!=null&&age<16?"invalid":""} type="date" value={birthDate} onChange={e=>{setBirthDate(e.target.value);setError("")}}/>
          {age!=null&&<small className={age<16?"field-error":"field-ok"}>{age<16?"Mindestens 16 Jahre erforderlich":age+" Jahre"}</small>}
        </div>
        <div className="segmented-field">
          <label>Geschlecht</label>
          <div>{[["male","Männlich"],["female","Weiblich"],["diverse","Divers"],["prefer_not_to_say","Keine Angabe"]].map(([value,label])=><button type="button" key={value} className={sex===value?"selected":""} onClick={()=>setSex(value)}>{label}</button>)}</div>
        </div>
        <div className="stepper-grid">
          <Stepper label="Größe" value={height} onChange={v=>{setHeight(v);setError("")}} min={120} max={230} unit=" cm"/>
          <Stepper label="Gewicht" value={weight} onChange={v=>{setWeight(v);setError("")}} min={35} max={250} step={0.5} unit=" kg"/>
        </div>
      </>}

      {step===4&&<>
        <h1>Wearable verbinden.</h1>
        <p>Health Daten werden nur nach ausdrücklicher Einwilligung verarbeitet und nicht für Werbung verwendet.</p>
        <button type="button" className={health?"health-choice selected":"health-choice"} onClick={()=>setHealth(!health)}>
          <span><b>{health?"✓":"+"}</b><strong>Health Daten verwenden</strong></span>
          <small>Schlaf · HRV · Ruhepuls · Schritte · VO2max · Workouts · Gewicht</small>
        </button>
        <p className="optional-note">Optional. Du kannst das später jederzeit in Settings verbinden.</p>
      </>}

      {step===5&&<>
        <h1>Mini Starttest.</h1>
        <p>Kein Tippen nötig. Passe die Werte einfach mit + und − an.</p>
        <div className="stepper-stack">
          <Stepper label="Push ups" value={pushups} onChange={setPushups} min={0} max={300}/>
          <Stepper label="Plank" value={plank} onChange={setPlank} min={0} max={1800} step={5} unit=" Sek."/>
          <div className="optional-stepper">
            <div className="optional-head"><span>5 km Lauf</span><button type="button" onClick={()=>setRun(run==null?30:null)}>{run==null?"HINZUFÜGEN":"+ ENTFERNEN"}</button></div>
            {run!=null&&<Stepper label="Zeit" value={run} onChange={setRun} min={10} max={120} step={0.5} unit=" Min."/>}
            {run==null&&<small>Optional. Nur hinzufügen, wenn du einen aktuellen Wert kennst.</small>}
          </div>
        </div>
      </>}

      {step===6&&<>
        <div className="first-score"><span className="eyebrow">READY</span><strong>100%</strong><b>SETUP</b></div>
        <h1>Jetzt beginnt die Entwicklung.</h1>
        <p>Der erste echte Score wird aus deinen gespeicherten Daten berechnet. Fehlende Werte werden nicht erfunden.</p>
      </>}

      {error&&<div className="form-error onboard-error">{error}</div>}

      <div className="onboard-actions sticky-actions">
        {step>1?<button type="button" className="back-button" onClick={back}>ZURÜCK</button>:<span/>}
        {step<6?<button type="button" className="primary" onClick={next}>WEITER →</button>:<button type="button" className="primary" onClick={finish} disabled={busy}>{busy?"SPEICHERN…":"ONBOARDING ABSCHLIESSEN →"}</button>}
      </div>
    </section>
  </main>;
}
