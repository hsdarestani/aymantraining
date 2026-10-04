import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../../lib/db";
import {createSession,hashToken} from "../../../../../lib/auth";
import {errorJson} from "../../../../../lib/http";
const schema=z.object({code:z.string().regex(/^\d{6}$/)});
export async function POST(request:Request){
 const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return errorJson("Ungültiger Kopplungscode.",422);
 const codeHash=hashToken(p.data.code),row=await prisma.companionPairCode.findUnique({where:{codeHash}});
 if(!row||row.claimedAt||row.expiresAt<=new Date())return errorJson("Kopplungscode ist ungültig oder abgelaufen.",404);
 const {token,expiresAt}=await createSession(row.userId);
 await prisma.companionPairCode.update({where:{id:row.id},data:{claimedAt:new Date()}});
 return NextResponse.json({ok:true,sessionToken:token,expiresAt:expiresAt.toISOString()});
}
