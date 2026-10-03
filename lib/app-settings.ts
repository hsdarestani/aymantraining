import {prisma} from "./db";
export const APP_SETTINGS_DEFAULTS={
 proMonthly:39.99,proYearly:399,proCapacity:50,waitlist:true,videoAnalysesPerMonth:2,coachResponseHours:24,nutritionMode:"manual",
 brandName:"BE DIFFERENT",accent:"#D7FF00",supportEmail:"",legalName:"",legalAddress:"",legalEmail:"",legalPhone:"",managingDirector:"",registerCourt:"",registerNumber:"",vatId:""
};
export async function getAppSettings(){const row=await prisma.systemSetting.findUnique({where:{key:"app_settings"}});return {...APP_SETTINGS_DEFAULTS,...((row?.value as object)||{})} as typeof APP_SETTINGS_DEFAULTS;}
