import {PrismaClient} from "@prisma/client";

const prisma=new PrismaClient();

try{
  const duplicates=await prisma.$queryRawUnsafe(`
    SELECT "provider", "externalId", array_agg("id" ORDER BY "updatedAt" DESC, "createdAt" DESC) AS ids
    FROM "Subscription"
    WHERE "externalId" IS NOT NULL
    GROUP BY "provider", "externalId"
    HAVING COUNT(*) > 1
  `);
  let normalized=0;
  for(const row of duplicates){
    const ids=Array.isArray(row.ids)?row.ids:[];
    for(const id of ids.slice(1)){
      await prisma.subscription.update({where:{id},data:{externalId:null}});
      normalized++;
    }
  }
  console.log(`Subscription preflight complete. Normalized ${normalized} duplicate external identifiers.`);
}finally{
  await prisma.$disconnect();
}
