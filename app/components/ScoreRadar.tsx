type PillarPoint={key:string;letter:string;label:string;value:number|null|undefined};

function point(i:number,r:number,cx=150,cy=150,count=7){
  const a=-Math.PI/2+i*2*Math.PI/count;
  return [cx+Math.cos(a)*r,cy+Math.sin(a)*r] as const;
}
function polygon(values:PillarPoint[],radius:number){
  return values.map((p,i)=>{
    const v=Math.max(0,Math.min(100,p.value??0));
    const [x,y]=point(i,radius*v/100);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}
function grid(scale:number,count=7){
  return Array.from({length:count},(_,i)=>{const [x,y]=point(i,108*scale);return `${x.toFixed(1)},${y.toFixed(1)}`}).join(" ");
}

export default function ScoreRadar({pillars}:{pillars:PillarPoint[]}){
  return <svg className="bd-score-radar" viewBox="0 0 300 300" role="img" aria-label="BD Score Radar">
    <defs>
      <radialGradient id="bdRadarFill" cx="50%" cy="45%" r="62%">
        <stop offset="0%" stopColor="#ff3657" stopOpacity=".24"/>
        <stop offset="72%" stopColor="#ff3657" stopOpacity=".10"/>
        <stop offset="100%" stopColor="#ff3657" stopOpacity=".03"/>
      </radialGradient>
      <filter id="bdRadarGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.5" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    {[.25,.5,.75,1].map(s=><polygon key={s} points={grid(s)} className="bd-radar-grid"/>)}
    {pillars.map((p,i)=>{const [x,y]=point(i,108);return <line key={p.key} x1="150" y1="150" x2={x} y2={y} className="bd-radar-axis"/>})}
    <polygon points={polygon(pillars,108)} fill="url(#bdRadarFill)" className="bd-radar-value" filter="url(#bdRadarGlow)"/>
    {pillars.map((p,i)=>{
      const [x,y]=point(i,130);
      const [vx,vy]=point(i,108*Math.max(0,Math.min(100,p.value??0))/100);
      return <g key={p.key}>
        <circle cx={vx} cy={vy} r="3.2" className="bd-radar-dot"/>
        <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="bd-radar-letter">{p.letter}</text>
      </g>
    })}
  </svg>;
}
