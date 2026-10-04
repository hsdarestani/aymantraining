import bcrypt from "bcryptjs";
import {PrismaClient} from "@prisma/client";

const password=process.env.ADMIN_PASSWORD;
if(!password||password.length<16)throw new Error("ADMIN_PASSWORD is required and must be at least 16 characters.");

const prisma=new PrismaClient();
try{
  const passwordHash=await bcrypt.hash(password,12);
  const user=await prisma.user.upsert({
    where:{email:"admin@bedifferent.smarbiz.sbs"},
    update:{
      passwordHash,
      name:"BE DIFFERENT Admin",
      role:"ADMIN",
      subscriptionTier:"ELITE",
      onboardingCompleted:true,
      locale:"de",
      timezone:"Europe/Berlin"
    },
    create:{
      email:"admin@bedifferent.smarbiz.sbs",
      passwordHash,
      name:"BE DIFFERENT Admin",
      role:"ADMIN",
      subscriptionTier:"ELITE",
      onboardingCompleted:true,
      locale:"de",
      timezone:"Europe/Berlin"
    }
  });
  console.log("ADMIN_BOOTSTRAPPED",user.email,user.role);
}finally{
  await prisma.$disconnect();
}
