import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {hashToken,revokeSession,SESSION_COOKIE} from "../../../../lib/auth";
import {isSameOrigin} from "../../../../lib/http";
import {prisma} from "../../../../lib/db";

export async function POST(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({ok:false},{status:403});
 const store=await cookies();
 const authorization=request.headers.get("authorization");
 const token=authorization?.startsWith("Bearer ")?authorization.slice(7).trim():store.get(SESSION_COOKIE)?.value;
 const body=authorization&&request.headers.get("x-bd-client")==="mobile"?await request.json().catch(()=>null):null;
 const deviceToken=body?.deviceToken;
 if(token&&typeof deviceToken==="string"&&deviceToken.length>=10&&deviceToken.length<=1000){
  const tokenHash=hashToken(token);
  await prisma.$transaction(async tx=>{
   const session=await tx.authSession.findUnique({where:{tokenHash},select:{userId:true,expiresAt:true}});
   if(session&&session.expiresAt>new Date())
    await tx.deviceToken.updateMany({where:{token:deviceToken,userId:session.userId},data:{active:false}});
   await tx.authSession.deleteMany({where:{tokenHash}});
  });
 }else await revokeSession(token);
 const response=NextResponse.json({ok:true});
 response.cookies.set(SESSION_COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0});
 return response;
}
