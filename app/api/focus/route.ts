import {NextResponse} from "next/server";
import {prisma} from "../../../lib/db";
import {errorJson,requireApiUser,dateOnly} from "../../../lib/http";
const defaults=[
 "Heute zählt die nächste saubere Entscheidung.",
 "Regeneration ist Teil deiner Entwicklung.",
 "Konstanz schlägt einen perfekten einzelnen Tag.",
 "Trainiere klar. Erhole dich bewusst.",
 "Baue den Athleten Schritt für Schritt."
];
export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const [row,check]=await Promise.all([prisma.systemSetting.findUnique({where:{key:"different_lines"}}),prisma.dailyCheck.findUnique({where:{userId_date:{userId:user.id,date:dateOnly()}}})]);
 const lines=Array.isArray(row?.value)?row!.value as string[]:defaults;
 const day=Math.floor(Date.now()/86400000),line=String(lines[day%Math.max(1,lines.length)]||defaults[0]);
 return NextResponse.json({ok:true,line,check});
}
