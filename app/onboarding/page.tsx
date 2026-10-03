"use client";

import Link from "next/link";
import {useState} from "react";

const goals=["Muskelaufbau","Fettabbau","Athletik","Fußball","Calisthenics","Gesundheit"];

export default function Onboarding(){
  const [step,setStep]=useState(1);
  const [goal,setGoal]=useState("Athletik");
  const [wearable,setWearable]=useState("Apple Health");
  const [pushups,setPushups]=useState("24");
  const [plank,setPlank]=useState("60");

  const next=()=>setStep(Math.min(6,step+1));
  const back=()=>setStep(Math.max(1,step-1));

  return <main className="onboard-shell">
    <Link href="/" className="brand">BE <span>DIFFERENT</span></Link>
    <section className="onboard-card">
      <div className="steps">{[1,2,3,4,5,6].map(n=><i key={n} className={n<step?"done":n===step?"active":""}/>)}</div>
      <span className="eyebrow">STEP {String(step).padStart(2,"0")} / 06</span>

      {step===1&&<>
        <h1>Normal is boring.</h1>
        <p>BE DIFFERENT baut deinen Athlete Score aus Training, Recovery, Schlaf, Aktivität und deinen eigenen Angaben auf.</p>
        <div className="onboard-highlight"><strong>BUILD YOUR ATHLETE</strong><span>Dein Coach bleibt sichtbar und entscheidet bei relevanten Planänderungen final.</span></div>
      </>}

      {step===2&&<>
        <h1>Was willst du verändern?</h1>
        <p>Das Ziel bestimmt Training, Tests und die Gewichtung deiner Empfehlungen.</p>
        <div className="goals">{goals.map(item=><button key={item} className={goal===item?"selected":""} onClick={()=>setGoal(item)}><span>{item}</span><b>{goal===item?"✓":"→"}</b></button>)}</div>
      </>}

      {step===3&&<>
        <h1>Deine Basis.</h1>
        <p>Diese Angaben helfen bei Plan und Referenzwerten. Sie ersetzen keine medizinische Diagnose.</p>
        <div className="input-grid">
          <label>Alter<input defaultValue="28" inputMode="numeric"/></label>
          <label>Größe<input defaultValue="182" inputMode="numeric"/><span>cm</span></label>
          <label>Gewicht<input defaultValue="82.4" inputMode="decimal"/><span>kg</span></label>
          <label>Trainingserfahrung<select defaultValue="Fortgeschritten"><option>Anfänger</option><option>Fortgeschritten</option><option>Sehr erfahren</option></select></label>
          <label>Trainingstage<select defaultValue="4"><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select></label>
          <label>Einheit<select defaultValue="60"><option>30 min</option><option>45 min</option><option>60</option><option>75 min</option></select></label>
        </div>
      </>}

      {step===4&&<>
        <h1>Wearable verbinden.</h1>
        <p>Wir lesen nur freigegebene Daten. Fehlende Werte werden als unvollständig markiert und nicht erfunden.</p>
        <div className="wearables large-options">{["Apple Health","Health Connect","Später"].map(item=><button key={item} className={wearable===item?"selected":""} onClick={()=>setWearable(item)}>{item}</button>)}</div>
        <div className="permission-note">Schritte · aktive Kalorien · Schlaf · HRV · Ruhepuls · VO2max · Workouts · Gewicht</div>
      </>}

      {step===5&&<>
        <h1>Mini Starttest.</h1>
        <p>Ein kurzer Baseline Test erzeugt den ersten Score. Optional kannst du später ein Video als Beleg hinzufügen.</p>
        <div className="test-inputs">
          <label><span>Push ups</span><input value={pushups} onChange={e=>setPushups(e.target.value)} inputMode="numeric"/><small>Wiederholungen</small></label>
          <label><span>Plank</span><input value={plank} onChange={e=>setPlank(e.target.value)} inputMode="numeric"/><small>Sekunden</small></label>
          <label><span>Lauf</span><input placeholder="optional"/><small>5 km Zeit</small></label>
        </div>
      </>}

      {step===6&&<>
        <div className="first-score">
          <span className="eyebrow">DEIN ERSTER SCORE</span><strong>43%</strong><b>AWAKE</b>
        </div>
        <h1>Jetzt beginnt die Entwicklung.</h1>
        <p>Starte mit FREE oder teste PRO sieben Tage mit Coach Radar, persönlichem Plan und direktem Coach Kontakt.</p>
        <div className="onboard-choices"><Link href="/" className="secondary">MIT FREE WEITER</Link><Link href="/pricing" className="primary">7 TAGE PRO TESTEN →</Link></div>
      </>}

      {step<6&&<div className="onboard-actions">
        {step===1?<Link href="/">ABBRECHEN</Link>:<button className="back-button" onClick={back}>ZURÜCK</button>}
        <button className="primary" onClick={next}>WEITER →</button>
      </div>}
    </section>
  </main>;
}
