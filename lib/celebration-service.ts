import {prisma} from "./db";
import {celebrationsEnabled,cutoffForPresentation,intensity} from "./celebration-contract";
import {getMilestoneSnapshot,presentMilestone} from "./milestone-service";
export const celebrationHeaders={"cache-control":"private, no-store","x-robots-tag":"noindex"};
export async function getCelebrations(userId:string,now=new Date()){
 if(!celebrationsEnabled())return {enabled:false,preference:{enabled:false,reduceMotion:false},pending:[]};
 // Ensure only genuine, independently earned Step 13 milestone awards can appear.
 const snapshot=await getMilestoneSnapshot(userId,now);
 const preference=await prisma.celebrationPreference.findUnique({where:{userId},
  select:{enabled:true,reduceMotion:true}});
 const setting=preference??{enabled:true,reduceMotion:false};
 const entries=setting.enabled?await prisma.milestoneAward.findMany({where:{userId,seenAt:null,
  createdAt:{gte:cutoffForPresentation(now)}},
  orderBy:[{createdAt:"asc"},{id:"asc"}],take:3,
  select:{id:true,title:true,message:true,visualIntensity:true,achievedAt:true}}):[];
 return {enabled:true,preference:setting,pending:entries.map(raw=>{const a=presentMilestone(raw,snapshot.locale,snapshot.athleteName);return ({
  id:a.id,title:a.title,message:a.message,intensity:intensity(a.visualIntensity),
  achievedAt:a.achievedAt.toISOString()
 })})};
}
