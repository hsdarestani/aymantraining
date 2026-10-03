import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {hashPassword,hashToken} from "../../../../lib/auth";
import {errorJson,isSameOrigin} from "../../../../lib/http";
const schema=z.object({token:z.string().min(20),password:z.string().min(10).max(128)});
export async function POST(request:Request){
  if(!isSameOrigin(request)) return errorJson("Ungültige Anfrage.",403);
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return errorJson("Ungültige Anfrage.",422);
  const row=await prisma.passwordResetToken.findUnique({where:{tokenHash:hashToken(parsed.data.token)}});
  if(!row||row.usedAt||row.expiresAt<=new Date()) return errorJson("Der Link ist ungültig oder abgelaufen.",410);
  const passwordHash=await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({where:{id:row.userId},data:{passwordHash}}),
    prisma.passwordResetToken.update({where:{id:row.id},data:{usedAt:new Date()}}),
    prisma.authSession.deleteMany({where:{userId:row.userId}})
  ]);
  return NextResponse.json({ok:true});
}
