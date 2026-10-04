import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser} from "../../../../lib/http";

export async function POST(request:Request){
  if(!isSameOrigin(request)&&request.headers.get("x-bd-client")!=="mobile")return errorJson("Ungültige Anfrage.",403);
  const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
  if(process.env.ENABLE_INTERNAL_TRIAL!=="true")return errorJson("Der PRO Test wird direkt über App Store oder Google Play gestartet.",409);
  const used=await prisma.subscription.findFirst({where:{userId:user.id,provider:"internal_trial"}});
  if(used)return errorJson("Der 7 Tage Test wurde bereits verwendet.",409);
  const trialEndsAt=new Date(Date.now()+7*86400000);
  await prisma.$transaction([
    prisma.subscription.create({data:{userId:user.id,tier:"PRO",provider:"internal_trial",status:"active",trialEndsAt,renewsAt:trialEndsAt}}),
    prisma.user.update({where:{id:user.id},data:{subscriptionTier:"PRO"}})
  ]);
  return NextResponse.json({ok:true,trialEndsAt});
}
