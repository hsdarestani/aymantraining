import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {requireRole} from "../../../../lib/auth";
import {errorJson,isSameOrigin} from "../../../../lib/http";
const schema=z.object({title:z.string().min(2).max(120),description:z.string().max(2000).optional(),type:z.enum(["MEETUP","TEST_DAY","VIDEO_CALL"]),startsAt:z.string().datetime(),endsAt:z.string().datetime().optional().nullable(),location:z.string().max(300).optional(),meetingUrl:z.string().url().optional().or(z.literal("")),capacity:z.number().int().min(1).max(10000).optional().nullable(),minTier:z.enum(["FREE","PRO","ELITE"]).default("FREE")});
export async function GET(){await requireRole(["COACH","ADMIN"]);const items=await prisma.event.findMany({orderBy:{startsAt:"desc"},include:{_count:{select:{registrations:true}}}});return NextResponse.json({ok:true,items})}
export async function POST(request:Request){await requireRole(["COACH","ADMIN"]);if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return errorJson("Ungültiges Event.",422);const item=await prisma.event.create({data:{...p.data,startsAt:new Date(p.data.startsAt),endsAt:p.data.endsAt?new Date(p.data.endsAt):null,meetingUrl:p.data.meetingUrl||null}});return NextResponse.json({ok:true,item})}
