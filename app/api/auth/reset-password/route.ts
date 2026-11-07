import {authRedirect,isAuthForm,readAuthPayload} from "../../../../lib/auth-form";
import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {hashPassword,hashToken} from "../../../../lib/auth";
import {errorJson,isSameOrigin} from "../../../../lib/http";
const schema=z.object({token:z.string().min(20),password:z.string().min(10).max(128)});
export async function POST(request:Request){
  if(!isSameOrigin(request)) return errorJson("Ungültige Anfrage.",403);
  const parsed=schema.safeParse(await readAuthPayload(request));
  if(!parsed.success) return errorJson("Ungültige Anfrage.",422);
  const row=await prisma.passwordResetToken.findUnique({where:{tokenHash:hashToken(parsed.data.token)}});
  if(!row||row.usedAt||row.expiresAt<=new Date()) return errorJson("Der Link ist ungültig oder abgelaufen.",410);
  const passwordHash=await hashPassword(parsed.data.password);
  const changed=await prisma.$transaction(async tx=>{
    const claimed=await tx.passwordResetToken.updateMany({
      where:{id:row.id,usedAt:null,expiresAt:{gt:new Date()}},data:{usedAt:new Date()},
    });
    if(claimed.count!==1)return false;
    await tx.user.update({where:{id:row.userId},data:{passwordHash}});
    await tx.authSession.deleteMany({where:{userId:row.userId}});
    return true;
  });
  if(!changed)return errorJson("Der Link ist ungültig oder abgelaufen.",410);
  return isAuthForm(request) ? authRedirect("/login") : NextResponse.json({ok:true});
}
