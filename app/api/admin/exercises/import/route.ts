import {NextResponse} from "next/server";
import {prisma} from "../../../../../lib/db";
import {requireRole} from "../../../../../lib/auth";
import {errorJson,isSameOrigin} from "../../../../../lib/http";

function parseCsv(text:string){
  const delimiter=(text.split("\n")[0]?.match(/;/g)?.length||0)>(text.split("\n")[0]?.match(/,/g)?.length||0)?";":",";
  const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;
  for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(ch===delimiter&&!quoted){row.push(cell.trim());cell=""}else if((ch==="\n"||ch==="\r")&&!quoted){if(ch==="\r"&&text[i+1]==="\n")i++;row.push(cell.trim());cell="";if(row.some(Boolean))rows.push(row);row=[]}else cell+=ch}
  row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;
}
const norm=(s:string)=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
const bool=(v:string)=>["1","true","yes","ja","free"].includes(v.trim().toLowerCase());
const split=(v:string)=>v.split(/[|;]/).map(x=>x.trim()).filter(Boolean);

export async function POST(request:Request){
  await requireRole(["COACH","ADMIN"]);if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
  const form=await request.formData();const file=form.get("file");if(!(file instanceof File))return errorJson("CSV fehlt.",422);
  if(file.size>3*1024*1024)return errorJson("CSV ist zu groß.",413);
  const rows=parseCsv(await file.text());if(rows.length<2)return errorJson("CSV enthält keine Datensätze.",422);
  const headers=rows[0].map(norm);const ix=(...names:string[])=>headers.findIndex(h=>names.map(norm).includes(h));
  const col={
    id:ix("Übungs-ID","Uebungs ID","exercise id","id"),nameDe:ix("Name DE","Name Deutsch","name de"),nameEn:ix("Name EN","Name Englisch","name en"),
    category:ix("Kategorie","category"),primary:ix("Zielmuskeln primär","primaer","primary muscles"),secondary:ix("Zielmuskeln sekundär","sekundaer","secondary muscles"),
    equipment:ix("Equipment"),level:ix("Level"),cue1:ix("Coach Cue 1","Cue 1"),cue2:ix("Coach Cue 2","Cue 2"),cue3:ix("Coach Cue 3","Cue 3"),
    mistakes:ix("Häufige Fehler","Fehler","common mistakes"),easier:ix("Leichter","easier exercise id"),harder:ix("Schwerer","harder exercise id"),
    tracking:ix("Tracking Typ","Tracking-Type","tracking type"),tags:ix("Tags","Schlagwörter","Schlagwoerter"),free:ix("FREE","Freigabe","free access")
  };
  if(col.id<0||col.nameDe<0||col.category<0)return errorJson("Pflichtspalten: Übungs-ID, Name DE, Kategorie.",422);
  let imported=0;const errors:string[]=[];
  for(let n=1;n<rows.length;n++){
    const r=rows[n];const get=(i:number)=>i>=0?(r[i]||"").trim():"";const id=get(col.id).toUpperCase();
    if(!/^BD-[A-Z]+-[0-9]{3}$/.test(id)){errors.push(`Zeile ${n+1}: ungültige ID`);continue;}
    const nameDe=get(col.nameDe),category=get(col.category);if(!nameDe||!category){errors.push(`Zeile ${n+1}: Name/Kategorie fehlt`);continue;}
    const data={nameDe,nameEn:get(col.nameEn)||null,category,equipment:get(col.equipment)||null,primaryMuscles:get(col.primary)||null,secondaryMuscles:get(col.secondary)||null,level:Math.max(1,Math.min(3,Number(get(col.level))||1)),coachCue1:get(col.cue1)||null,coachCue2:get(col.cue2)||null,coachCue3:get(col.cue3)||null,commonMistakes:split(get(col.mistakes)),easierExerciseId:get(col.easier)||null,harderExerciseId:get(col.harder)||null,trackingType:get(col.tracking)||null,tags:split(get(col.tags)),freeAccess:bool(get(col.free)),active:true};
    await prisma.exercise.upsert({where:{id},update:data,create:{id,...data}});imported++;
  }
  return NextResponse.json({ok:true,imported,errors:errors.slice(0,50)});
}