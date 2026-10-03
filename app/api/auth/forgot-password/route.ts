import crypto from "node:crypto";
import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {hashToken} from "../../../../lib/auth";
import {errorJson,isSameOrigin} from "../../../../lib/http";
import {sendEmail} from "../../../../lib/email";

const schema=z.object({email:z.string().email().transform(v=>v.trim().toLowerCase())});
export async function POST(request:Request){
  if(!isSameOrigin(request)) return errorJson("Ungültige Anfrage.",403);
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return errorJson("Ungültige E-Mail.",422);
  const user=await prisma.user.findUnique({where:{email:parsed.data.email}});
  if(user){
    const token=crypto.randomBytes(32).toString("base64url");
    await prisma.passwordResetToken.deleteMany({where:{userId:user.id,usedAt:null}});
    await prisma.passwordResetToken.create({data:{userId:user.id,tokenHash:hashToken(token),expiresAt:new Date(Date.now()+30*60*1000)}});
    const base=process.env.NEXT_PUBLIC_APP_URL||"https://bedifferent.smarbiz.sbs";
    await sendEmail(user.email,"BE DIFFERENT · Passwort zurücksetzen",`<p>Du hast ein neues Passwort angefordert.</p><p><a href="${base}/reset-password?token=${encodeURIComponent(token)}">Passwort zurücksetzen</a></p><p>Der Link ist 30 Minuten gültig.</p>`);
  }
  return NextResponse.json({ok:true});
}
