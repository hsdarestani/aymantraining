import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {requireRole} from "../../../../lib/auth";
import {errorJson,isSameOrigin} from "../../../../lib/http";
import {integrationStatus} from "../../../../lib/integrations";
import {APP_SETTINGS_DEFAULTS} from "../../../../lib/app-settings";

const schema=z.object({
  proMonthly:z.number().min(0).max(999),
  proYearly:z.number().min(0).max(9999),
  proCapacity:z.number().int().min(0).max(100000),
  waitlist:z.boolean(),
  videoAnalysesPerMonth:z.number().int().min(0).max(100),
  coachResponseHours:z.number().int().min(1).max(168),
  nutritionMode:z.enum(["manual","external","internal"]),
  brandName:z.string().min(2).max(80),
  accent:z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  supportEmail:z.string().email().or(z.literal("")),
  legalName:z.string().max(160),
  legalAddress:z.string().max(500),
  legalEmail:z.string().email().or(z.literal("")),
  legalPhone:z.string().max(80),
  managingDirector:z.string().max(160),
  registerCourt:z.string().max(160),
  registerNumber:z.string().max(120),
  vatId:z.string().max(120)
});

export async function GET(){
  await requireRole(["COACH","ADMIN"]);
  const row=await prisma.systemSetting.findUnique({where:{key:"app_settings"}});
  return NextResponse.json({ok:true,value:{...APP_SETTINGS_DEFAULTS,...((row?.value as object)||{})},integrations:integrationStatus()});
}
export async function PATCH(request:Request){
  await requireRole(["COACH","ADMIN"]);
  if(!isSameOrigin(request)) return errorJson("Ungültige Anfrage.",403);
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return errorJson("Ungültige App Einstellungen.",422);
  await prisma.systemSetting.upsert({where:{key:"app_settings"},update:{value:parsed.data},create:{key:"app_settings",value:parsed.data}});
  return NextResponse.json({ok:true,value:parsed.data});
}
