"use client";

import {useState} from "react";
import {Copy, LocalizedValue, useT} from "../components/Locale";

type Point = {date: Date; total: number};
const ranges = [{days:30,label:"30 Tage"},{days:90,label:"90 Tage"},{days:0,label:"Alle Messungen"}];
const grid = [100, 75, 50, 25, 0];

export default function ScoreTrace({points, today}: {points: Point[]; today: Date}) {
  const t = useT();
  const [range, setRange] = useState(0);
  const [sample, setSample] = useState<number | null>(null);
  const visible = range ? points.filter(p => +p.date >= +today - (range - 1) * 86400000) : points;
  const index = Math.min(sample ?? visible.length - 1, visible.length - 1);
  const current = visible[index];
  const first = visible[0];
  const last = visible.at(-1);
  const span = first && last ? +last.date - +first.date : 0;
  const coords = visible.map(p => ({x: span ? 45 + ((+p.date - +first.date) / span) * 615 : 352, y: 184 - p.total * 1.62}));
  const delta = first && last && span ? last.total - first.total : null;

  return <section className="bd-score-trace" aria-label={t("Verlauf des BD Score")}>
    <div className="bd-trace-controls">
      <div role="group" aria-label={t("Zeitraum auswählen")}>
        {ranges.map(option => <button key={option.days} type="button" aria-pressed={range === option.days}
          onClick={() => {setRange(option.days);setSample(null);}}><Copy text={option.label}/></button>)}
      </div>
      {delta != null && <span className="bd-kicker">{delta > 0 ? "+" : ""}{delta} <Copy text="Punkte im Zeitraum"/></span>}
    </div>
    {current ? <>
      <div className="bd-trace-reading" aria-live="polite">
        <strong>{current.total}</strong>
        <time dateTime={current.date.toISOString().slice(0,10)}><LocalizedValue value={current.date} format="toLocaleDateString" options={{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}}/></time>
      </div>
      <svg viewBox="0 0 685 201" preserveAspectRatio="none" className="bd-trace-svg" aria-hidden="true">
        {grid.map(value => <g key={value}>
          <line x1="43" x2="665" y1={184-value*1.62} y2={184-value*1.62}/>
          <text x="4" y={188-value*1.62}>{value}</text>
        </g>)}
        <line className="bd-trace-cursor" x1={coords[index].x} x2={coords[index].x} y1="22" y2="184"/>
        {coords.length > 1 && <polyline points={coords.map(p => p.x + "," + p.y).join(" ")}/>}
        {coords.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i === index ? 5 : 3} className={i === index ? "is-reading" : undefined}/>)}
      </svg>
      <div className="bd-trace-dates">
        <time><LocalizedValue value={first.date} format="toLocaleDateString" options={{day:"numeric",month:"short",timeZone:"UTC"}}/></time>
        {span > 0 && <time><LocalizedValue value={last!.date} format="toLocaleDateString" options={{day:"numeric",month:"short",timeZone:"UTC"}}/></time>}
      </div>
      {visible.length > 1 && <label className="bd-trace-range">
        <span className="bd-kicker"><Copy text="Messpunkt wählen"/></span>
        <input type="range" min={0} max={visible.length - 1} step={1} value={index}
          aria-valuetext={current.date.toISOString().slice(0,10) + " · " + current.total}
          onChange={e => setSample(Number(e.target.value))}/>
      </label>}
    </> : <p className="bd-trace-empty"><Copy text="Für diesen Zeitraum liegen keine Messwerte vor."/></p>}
  </section>;
}
