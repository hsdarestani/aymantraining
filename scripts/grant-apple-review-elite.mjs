import {PrismaClient} from "@prisma/client";
const reviewEmail="appreview@bedifferent.smarbiz.sbs";
const provider="internal_review";
const externalId="apple-review-elite-2026";
const db=new PrismaClient();
try{
  const initial=await db.user.findUnique({where:{email:reviewEmail},select:{id:true,role:true,onboardingCompleted:true,subscriptionTier:true}});
  if(!initial||initial.role!=="ATHLETE"||!initial.onboardingCompleted)throw new Error("Reviewer account missing or not onboarded as athlete; no changes made.");
  await db.$transaction(async tx=>{
    const previous=await tx.subscription.findUnique({where:{provider_externalId:{provider,externalId}}});
    if(previous&&previous.userId!==initial.id)throw new Error("Review grant belongs to a different user. No changes made.");
    if(previous){
      await tx.subscription.update({where:{id:previous.id},data:{tier:"ELITE",status:"active",trialEndsAt:null,renewsAt:null}});
    }else{
      await tx.subscription.create({data:{userId:initial.id,tier:"ELITE",provider,externalId,status:"active",trialEndsAt:null,renewsAt:null}});
    }
    await tx.user.update({where:{id:initial.id},data:{subscriptionTier:"ELITE"}});
  });
  const updated=await db.user.findUnique({where:{email:reviewEmail},select:{role:true,onboardingCompleted:true,subscriptionTier:true}});
  const grant=await db.subscription.findUnique({where:{provider_externalId:{provider,externalId}}});
  if(updated?.subscriptionTier!=="ELITE"||!updated.onboardingCompleted||grant?.tier!=="ELITE"||grant.status!=="active")throw new Error("Could not verify ELITE review grant");
  console.log("APPLE_REVIEW_TIER=ELITE");
  console.log("APPLE_REVIEW_GRANT=ACTIVE_NO_EXPIRY_NO_PAYMENT");
}catch(e){
  console.error("APPLE_REVIEW_GRANT_FAILED:",e instanceof Error?e.message:"unknown error");
  process.exitCode=1;
}finally{await db.$disconnect();}
