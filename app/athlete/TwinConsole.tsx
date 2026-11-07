"use client";

import Link from "next/link";
import {useState} from "react";
import {Copy, LocalizedValue, useT} from "../components/Locale";

type Signal = {value: number | null; unit?: string};
type Props = {sleep: Signal; protein: Signal; energy: Signal; hasCheckIn: boolean};
const stations = [
  {name:"BE AWAKE",label:"Tagesstart",href:"/awake",action:"Morgenroutine öffnen",x:56,y:15},
  {name:"BE FOCUSED",label:"Tagescheck",href:"/focus",action:"Fokus öffnen",x:75,y:32},
  {name:"BE FUEL",label:"Protein heute",href:"/fuel",action:"Ernährung öffnen",x:43,y:48},
  {name:"BE RESTED",label:"Schlafdauer",href:"/lifestyle",action:"Erholung öffnen",x:61,y:68},
] as const;

export default function TwinConsole({sleep, protein, energy, hasCheckIn}: Props) {
  const [active, setActive] = useState(0);
  const t = useT();
  const station = stations[active];
  const signal = [energy, null, protein, sleep][active];

  return <section className="bd-twin-console">
    <div className="bd-twin-figure" role="group" aria-label={t("Bereiche des Digital Twin")}>
      <span className="bd-twin-stamp"><Copy text="Digital Twin"/></span>
      <svg viewBox="0 0 300 360" fill="none" aria-hidden="true">
        <path className="bd-twin-gridline" d="M30 18v323m60-323v323m60-323v323m60-323v323m60-323v323M12 39h276M12 105h276M12 171h276M12 237h276M12 303h276"/>
        <circle className="bd-twin-orbit-line" cx="150" cy="173" r="105"/>
        <circle className="bd-twin-orbit-line" cx="150" cy="173" r="76"/>
        <g className="bd-twin-runner">
          <path d="M174 30c19-5 35 8 36 24l-4 12 2 13-11 3-6 16-20-3-8 18-27-6 11-24c-10-18-6-44 27-53z"/>
          <path d="M150 94c-15 1-31 9-43 25l-34 47-44 18 4 12 56-11 34-31-1 30-16 27 33 25 29-21 18-67 31 7 20-15 30-44-10-8-39 37-25-15c-11-11-25-15-43-16z"/>
          <path d="M139 223l37 2 34 38-10 54 13 11-4 11-25-4-2-20 4-39-37-20-25 22-53 8-7 19-14 2-1-36 61-23 12-17z"/>
        </g>
        <path className="bd-twin-axis" d="m150 95 14 31-22 51-4 46m-31-104 37 7 40 23m-63 35 43-1M109 212l29-7 27 10m-45 35 27-10 31-13M99 169l-14-14m134-25 16 12m-72-83 42-10m-46 23 47-2"/>
        <path className="bd-twin-axis" d="M14 335h87m-87-9v18m263-18v18m-87-9h87"/>
      </svg>
      {stations.map((item,i)=><button key={item.name} className="bd-twin-pin" type="button"
        style={{left:item.x+"%",top:item.y+"%"}} aria-label={item.name} aria-pressed={active===i}
        aria-controls="bd-twin-reading" onClick={()=>setActive(i)}><span>0{i+1}</span></button>)}
    </div>
    <div className="bd-twin-instrument">
      <div className="bd-twin-dials" role="group" aria-label={t("Bereiche des Digital Twin")}>
        {stations.map((item,i)=><button type="button" key={item.name} aria-pressed={active===i}
          aria-controls="bd-twin-reading" onClick={()=>setActive(i)}>
          <span className="bd-kicker">0{i+1}</span><Copy text={item.name}/>
        </button>)}
      </div>
      <div id="bd-twin-reading" className="bd-twin-reading" aria-live="polite">
        <span className="bd-kicker"><Copy text={active === 0 ? "Energie heute" : station.label}/></span>
        <strong>{active === 1 ? <Copy text={hasCheckIn ? "Erfasst" : "Offen"}/> : signal?.value != null ?
          <><LocalizedValue value={signal.value} options={{maximumFractionDigits:1}}/> <small>{signal.unit}</small></>
          : <Copy text="Keine Angabe"/>}</strong>
        <Link prefetch={false} href={station.href} className="bd-text-link"><Copy text={station.action}/></Link>
      </div>
    </div>
  </section>;
}
