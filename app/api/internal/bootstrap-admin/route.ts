import crypto from "node:crypto";
import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";

const TOKEN_HASH="b9c8389ab9094645d29cc3c81e68a714dd846cad2ba8156731bdf31b672ad96b";
const ADMIN_EMAIL="admin@bedifferent.smarbiz.sbs";
const ADMIN_PASSWORD_HASH="$2b$12$AQ6ABabDbCF21mT5FFfbnuh4Lm1WXQDvA9l0HamdkNCIlqkTrKJkC";

function validToken(token:string){
  const actual=crypto.createHash("sha256").update(token).digest();
  const expected=Buffer.from(TOKEN_HASH,"hex");
  return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);
}

export async function GET(request:Request){
  const token=new URL(request.url).searchParams.get("token")||"";
  if(!validToken(token))return NextResponse.json({ok:false},{status:404});

  const user=await prisma.user.upsert({
    where:{email:ADMIN_EMAIL},
    update:{
      passwordHash:ADMIN_PASSWORD_HASH,
      name:"BE DIFFERENT Admin",
      role:"ADMIN",
      subscriptionTier:"ELITE",
      onboardingCompleted:true,
      locale:"de",
      timezone:"Europe/Berlin"
    },
    create:{
      email:ADMIN_EMAIL,
      passwordHash:ADMIN_PASSWORD_HASH,
      name:"BE DIFFERENT Admin",
      role:"ADMIN",
      subscriptionTier:"ELITE",
      onboardingCompleted:true,
      locale:"de",
      timezone:"Europe/Berlin"
    }
  });

  return NextResponse.json({ok:true,email:user.email,role:user.role});
}
