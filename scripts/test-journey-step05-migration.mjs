import assert from "node:assert/strict";
import {PrismaClient} from "@prisma/client";
if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Migration probe requires disposable Postgres.");
const db=new PrismaClient();
try{
 const key="step05_migration_probe";
 if(process.argv[2]==="seed"){
  const path=await db.journeyPathway.create({data:{slug:key,titleDe:"Legacy published curriculum"}});
  await db.journeyPathwayVersion.create({data:{
   pathwayId:path.id,version:1,state:"PUBLISHED",goalSlugs:["health"],publishedAt:new Date("2026-10-01T00:00:00Z")
  }});
  console.log("STEP05_PREEXISTING_VERSION_SEEDED");
 }else if(process.argv[2]==="verify"){
  const path=await db.journeyPathway.findUnique({where:{slug:key},
   include:{versions:true}});
  assert(path);
  assert.equal(path.versions.length,1);
  assert.equal(path.versions[0].state,"PUBLISHED");
  assert(path.versions[0].updatedAt instanceof Date);
  console.log("STEP05_PREEXISTING_VERSION_PRESERVED");
 }else throw Error("Use seed or verify");
}finally{await db.$disconnect();}
