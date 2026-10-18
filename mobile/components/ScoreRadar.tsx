import Svg,{Circle,Line,Polygon,Text as SvgText} from "react-native-svg";

type Pillar={letter:string;value:number|null|undefined};
const count=7;
const clamp=(v:number)=>Math.max(0,Math.min(100,v));
const xy=(i:number,r:number):[number,number]=>{
 const angle=-Math.PI/2+i*2*Math.PI/count;
 return [150+Math.cos(angle)*r,150+Math.sin(angle)*r];
};
const coords=(values:ReadonlyArray<Pillar>,radius:number)=>values.map((p,i)=>{
 const [x,y]=xy(i,radius*clamp(typeof p.value==="number"&&Number.isFinite(p.value)?p.value:0)/100);
 return `${x.toFixed(1)},${y.toFixed(1)}`;
}).join(" ");
const ring=(radius:number)=>Array.from({length:count},(_,i)=>xy(i,radius).map(v=>v.toFixed(1)).join(",")).join(" ");

export default function ScoreRadar({pillars}:{pillars:ReadonlyArray<Pillar>}){
 const available=pillars.some(p=>typeof p.value==="number"&&Number.isFinite(p.value));
 return <Svg width="100%" height={245} viewBox="0 0 300 300" accessible accessibilityLabel="BE DIFFERENT SCORE Radar mit sieben Leistungsbereichen">
  {[27,54,81,108].map(r=><Polygon key={r} points={ring(r)} stroke="#333C3A" strokeWidth={1} fill="none"/>)}
  {pillars.map((p,i)=>{const [x,y]=xy(i,108);return <Line key={p.letter} x1={150} y1={150} x2={x} y2={y} stroke="#29322F" strokeWidth={1}/>})}
  {available?<Polygon points={coords(pillars,108)} fill="#FF3D591F" stroke="#FF526D" strokeWidth={1.5}/>:null}
  {pillars.map((p,i)=>{
   const [lx,ly]=xy(i,130);
   const numeric=typeof p.value==="number"&&Number.isFinite(p.value);
   const [dx,dy]=xy(i,108*(numeric?clamp(p.value as number):0)/100);
   return <Circle key={p.letter} cx={dx} cy={dy} r={numeric?3.2:1} fill={numeric?"#FF536E":"#66706D"}/>;
  })}
  {pillars.map((p,i)=>{
   const [x,y]=xy(i,143);
   return <SvgText key={p.letter} x={x} y={y+4} textAnchor="middle" fontFamily="ManropeSemiBold" fontSize={13} fill="#DFE7E1">{p.letter}</SvgText>;
  })}
 </Svg>;
}
