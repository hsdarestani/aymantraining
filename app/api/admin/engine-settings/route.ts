import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {requireRole} from "../../../../lib/auth";
import {errorJson,isSameOrigin} from "../../../../lib/http";

const schema=z.object({
  formula:z.object({
    sleepTargetHours:z.number().min(4).max(12),
    proteinTargetGPerKg:z.number().min(.5).max(4),
    waterTargetMl:z.number().int().min(500).max(10000),
    checkinsPerWeek:z.number().int().min(1).max(7),
    performanceChangeMultiplier:z.number().min(10).max(500)
  }),
  radar:z.object({green:z.number().int().min(1).max(100),amber:z.number().int().min(0).max(99)}).refine(v=>v.green>v.amber,{message:"Grün muss über Gelb liegen"})
});

const defaults={formula:{sleepTargetHours:8,proteinTargetGPerKg:1.6,waterTargetMl:2500,checkinsPerWeek:5,performanceChangeMultiplier:125},radar:{green:80,amber:60}};

export async function GET(){
  await requireRole(["COACH","ADMIN"]);
  const rows=await prisma.systemSetting.findMany({where:{key:{in:["score_formula","radar_thresholds"]}}});
  const map=new Map(rows.map(x=>[x.key,x.value]));
  return NextResponse.json({ok:true,value:{formula:{...defaults.formula,...((map.get("score_formula") as object)||{})},radar:{...defaults.radar,...((map.get("radar_thresholds") as object)||{})}}});
}

export async function PATCH(request:Request){
  await requireRole(["COACH","ADMIN"]);if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
  const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return errorJson("Ungültige Engine Einstellungen.",422);
  await prisma.$transaction([
    prisma.systemSetting.upsert({where:{key:"score_formula"},update:{value:p.data.formula},create:{key:"score_formula",value:p.data.formula}}),
    prisma.systemSetting.upsert({where:{key:"radar_thresholds"},update:{value:p.data.radar},create:{key:"radar_thresholds",value:p.data.radar}})
  ]);
  return NextResponse.json({ok:true,value:p.data});
}