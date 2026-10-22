import {prisma} from "./db";
import type {SubscriptionTier} from "@prisma/client";

/** Legacy exercise assets are not automatically public PRO lessons.
 * No raw storage keys or URLs are exposed from this gate. */
export async function canReadLegacyExerciseVideo(args:{
  userId:string,assetId:string,tier:SubscriptionTier,role:string
}):Promise<boolean>{
 if(args.role==="ADMIN")return true;
 const asset=await prisma.mediaAsset.findUnique({where:{id:args.assetId},
   select:{ownerId:true,storageKey:true,kind:true}});
 if(!asset||asset.kind!=="EXERCISE_VIDEO"||asset.storageKey.startsWith("journey-media/"))return false;
 if((args.role==="COACH"||args.role==="ADMIN")&&asset.ownerId===args.userId)return true;
 const videoUrl="/api/media/"+args.assetId;
 // Legacy videos can only be accessed by athletes who have the full exercise library,
 // or their own actually assigned workouts with PRO tier. Never grant by mere asset ID.
 if(!["PRO","ELITE"].includes(args.tier))return false;
 const exerciseIds=await prisma.exercise.findMany({
   where:{active:true,videoUrl},select:{id:true},take:250
 });
 if(!exerciseIds.length)return false;
 const ids=exerciseIds.map(e=>e.id);
 const owned=await prisma.workoutExercise.findFirst({
   where:{exerciseId:{in:ids},workout:{userId:args.userId}},select:{id:true}
 });
 if(owned)return true;
 const assigned=await prisma.planAssignment.findFirst({
   where:{userId:args.userId,active:true,plan:{active:true,items:{some:{exerciseId:{in:ids}}}}},
   select:{id:true}
 });
 if(assigned)return true;
 // PRO full library entitles published public exercises, not locked Journey assets.
 return Boolean(await prisma.exercise.findFirst({where:{id:{in:ids},active:true},
   select:{id:true}}));
}
