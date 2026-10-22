import {prisma} from "./db";
import type {JourneyDashboard} from "@prisma/client";

export type PresenterPreference="ANY"|"TRAINERIN";
export type DashboardPreference={
 enabled:boolean;mode:JourneyDashboard;presenterPreference:PresenterPreference;
 source:"saved"|"onboarding"|"default";cycleModuleEnabled:false;
};
export const dashboardEnabled=()=>process.env.WOMEN_DASHBOARD_ENABLED==="true";

/** This is an interface preference, not a declaration of sex or health state.
 * Safe fallback for older shared-host DBs before the additive table exists.
 */
export async function getDashboardPreference(userId:string):Promise<DashboardPreference>{
 const base:DashboardPreference={enabled:dashboardEnabled(),mode:"GENERAL",presenterPreference:"ANY",source:"default",cycleModuleEnabled:false};
 if(!dashboardEnabled())return base;
 const saved=await prisma.athleteDashboardPreference.findUnique({where:{userId},
  select:{mode:true,presenterPreference:true}});
 if(saved)return {...base,mode:saved.mode,presenterPreference:saved.presenterPreference==="TRAINERIN"?"TRAINERIN":"ANY",source:"saved"};
 if(process.env.JOURNEY_ONBOARDING_ENABLED==="true"){
  const intake=await prisma.journeyIntake.findUnique({where:{userId},select:{dashboard:true}});
  if(intake)return {...base,mode:intake.dashboard,source:"onboarding"};
 }
 return base;
}

/** Prioritize licensed/approved presenter variants if available.
 * Never create a synthetic trainer or discard another authorized variant.
 */
export function sortPresenterVariants<T extends {presenter:string}>(
 variants:T[],preference:PresenterPreference
):T[]{
 if(preference!=="TRAINERIN")return variants;
 return variants.map((item,index)=>({item,index})).sort((a,b)=>
   Number(b.item.presenter==="TRAINER")-Number(a.item.presenter==="TRAINER")||a.index-b.index
 ).map(x=>x.item);
}
