"use client";

import {useState} from "react";
import Link from "next/link";
import {Copy, LocalizedValue, useT} from "./Locale";

type RhythmDay = {
  label: string;
  date: Date;
  workouts: Array<{id: string; title: string; scheduledAt: Date | null; completed: boolean}>;
};

export default function RhythmHorizon({days, timeZone}: {days: RhythmDay[]; timeZone: string}) {
  const t = useT();
  const [active, setActive] = useState(1);
  const day = days[active];

  return <section className="bd-rhythm-track" aria-labelledby="bd-rhythm-heading">
    <header className="bd-rhythm-title">
      <h2 id="bd-rhythm-heading"><Copy text="Dein Rhythmus"/></h2>
      <span className="bd-kicker">72 h</span>
    </header>
    <div className="bd-rhythm-days" role="group" aria-label={t("Trainingstag auswählen")}>
      {days.map((item, index) => <button key={item.label} type="button" onClick={() => setActive(index)}
        aria-pressed={index === active} aria-controls="bd-rhythm-schedule">
        <span className="bd-kicker"><Copy text={item.label}/></span>
        <span className="bd-rhythm-date"><LocalizedValue value={item.date} format="toLocaleDateString" options={{day:"2-digit", month:"2-digit", timeZone:"UTC"}}/></span>
        <span className="bd-rhythm-tick" aria-hidden="true"/>
      </button>)}
    </div>
    <div id="bd-rhythm-schedule" className="bd-rhythm-schedule" aria-live="polite">
      {day.workouts.length ? day.workouts.map(workout => <Link key={workout.id} href={"/training/" + workout.id}>
        <time><LocalizedValue value={workout.scheduledAt} format="toLocaleTimeString" options={{hour:"2-digit", minute:"2-digit", timeZone}}/></time>
        <strong><Copy text={workout.title}/></strong>
        {workout.completed && <small><Copy text="ERLEDIGT"/></small>}
      </Link>) : <p><Copy text="Keine Einheit eingetragen."/></p>}
    </div>
  </section>;
}
