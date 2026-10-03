"use client";

import Link from "next/link";
import {useState} from "react";

const goals=["Muskelaufbau","Fettabbau","Athletik","Fußball","Calisthenics","Gesundheit"];

export default function Onboarding(){
  const [goal,setGoal]=useState("Athletik");
  const [wearable,setWearable]=useState("Apple Health");

  return <main className="onboard-shell">
    <Link href="/" className="brand">BE <span>DIFFERENT</span></Link>
    <section className="onboard-card">
      <div className="steps"><i className="done"/><i className="active"/><i/><i/><i/></div>
      <span className="eyebrow">STEP 02 / 05</span>
      <h1>Was willst du verändern?</h1>
      <p>Das Ziel bestimmt Training, Tests und die Gewichtung deiner täglichen Empfehlungen.</p>

      <div className="goals">
        {goals.map(item=><button key={item} className={goal===item?"selected":""} onClick={()=>setGoal(item)}>
          <span>{item}</span><b>{goal===item?"✓":"→"}</b>
        </button>)}
      </div>

      <div className="wearable-block">
        <span className="eyebrow">WEARABLE</span>
        <div className="wearables">
          {["Apple Health","Health Connect","Später"].map(item=><button key={item} className={wearable===item?"selected":""} onClick={()=>setWearable(item)}>{item}</button>)}
        </div>
      </div>

      <div className="onboard-actions">
        <Link href="/">ZURÜCK</Link>
        <Link href="/" className="primary">WEITER →</Link>
      </div>
    </section>
  </main>;
}
