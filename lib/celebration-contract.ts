import {z} from "zod";
export const celebrationsEnabled=()=>process.env.CELEBRATIONS_ENABLED==="true"&&process.env.MILESTONES_ENABLED==="true";
export const celebrationPreferencesSchema=z.object({enabled:z.boolean(),reduceMotion:z.boolean()}).strict();
export const eventSchema=z.discriminatedUnion("action",[
 z.object({action:z.literal("ACKNOWLEDGE"),awardId:z.string().min(1)}).strict(),
 z.object({action:z.literal("SET_PREFERENCES"),enabled:z.boolean(),reduceMotion:z.boolean()}).strict()
]);
export type Intensity="SMALL"|"MEDIUM"|"FULL";
export const intensity=(value:string):Intensity=>value==="MEDIUM"||value==="FULL"?value:"SMALL";
export function visualPolicy(level:string,systemReduceMotion:boolean,manualReduceMotion:boolean){
 const mode=intensity(level);
 if(systemReduceMotion||manualReduceMotion)return {mode,animated:false,particles:0,durationMs:0};
 return {mode,animated:true,particles:mode==="FULL"?10:mode==="MEDIUM"?5:0,
  durationMs:mode==="FULL"?1250:mode==="MEDIUM"?850:440};
}
export const cutoffForPresentation=(now=new Date())=>new Date(now.getTime()-14*86400000);
