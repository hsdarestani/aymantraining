import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser,dateOnly} from "../../../lib/http";
import {recomputeScoreForUser} from "../../../lib/scoring";
import {hasFeature} from "../../../lib/entitlements";

const schema=z.object({
 date:z.string().date().optional(),calories:z.number().min(0).max(20000).optional(),proteinG:z.number().min(0).max(1000).optional(),
 carbsG:z.number().min(0).max(2000).optional(),fatG:z.number().min(0).max(1000).optional(),waterMl:z.number().int().min(0).max(20000).optional(),
 fruitVegServings:z.number().min(0).max(50).optional(),addedSugarG:z.number().min(0).max(1000).optional(),processedFoodScore:z.number().int().min(0).max(100).optional(),source:z.string().max(80).optional()
});

function grade(score:number|null|undefined){const x=score??0;return x>=85?"A":x>=70?"B":x>=55?"C":x>=40?"D":"E"}
function age(birth:Date|null){return birth?Math.max(16,Math.floor((Date.now()-birth.getTime())/31557600000)):30}
function calorieTarget(user:any,kg:number){
 if(!user.heightCm)return 2200;
 const sexOffset=user.sex==="female"?-161:user.sex==="male"?5:-78;
 const bmr=10*kg+6.25*user.heightCm-5*age(user.birthDate)+sexOffset;
 return Math.round(bmr*1.45);
}
function fuel(v:z.infer<typeof schema>,targets:{proteinG:number;waterMl:number;calories:number}){
 const parts:number[]=[];
 if(v.proteinG!=null)parts.push(Math.min(100,v.proteinG/targets.proteinG*100));
 if(v.waterMl!=null)parts.push(Math.min(100,v.waterMl/targets.waterMl*100));
 if(v.calories!=null){const diff=Math.abs(v.calories-targets.calories)/targets.calories;parts.push(Math.max(0,100-diff*140))}
 if(v.fruitVegServings!=null)parts.push(Math.min(100,v.fruitVegServings/5*100));
 if(v.addedSugarG!=null)parts.push(Math.max(0,100-v.addedSugarG*2));
 if(v.processedFoodScore!=null)parts.push(100-v.processedFoodScore);
 return parts.length?Math.round(parts.reduce((a,b)=>a+b,0)/parts.length):undefined;
}
async function targets(user:any){
 const [ctx,body]=await Promise.all([prisma.athleteContext.findUnique({where:{userId:user.id}}),prisma.bodyMetric.findFirst({where:{userId:user.id},orderBy:{date:"desc"}})]);
 const kg=body?.weightKg||70;
 return {proteinG:ctx?.proteinTargetG??Math.round(kg*1.6),waterMl:ctx?.waterTargetMl??2500,calories:calorieTarget(user,kg)};
}

export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(!await hasFeature(user.subscriptionTier,"nutrition_fuel"))return errorJson("BE FUEL ist PRO.",403);
 const [items,t]=await Promise.all([prisma.nutritionDaily.findMany({where:{userId:user.id},orderBy:{date:"desc"},take:30}),targets(user)]);
 return NextResponse.json({ok:true,items:items.map(x=>({...x,fuelGrade:grade(x.fuelScore)})),targets:t});
}
export async function POST(request:Request){
 if(!isSameOrigin(request)&&request.headers.get("x-bd-client")!=="mobile")return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(!await hasFeature(user.subscriptionTier,"nutrition_fuel"))return errorJson("BE FUEL ist PRO.",403);
 const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return errorJson("Ungültige Ernährungsdaten.",422);
 const date=dateOnly(p.data.date?new Date(p.data.date):new Date()),t=await targets(user),fuelScore=fuel(p.data,t);
 const {date:_date,...values}=p.data;
 const item=await prisma.nutritionDaily.upsert({where:{userId_date:{userId:user.id,date}},update:{...values,fuelScore},create:{userId:user.id,date,...values,fuelScore}});
 const score=await recomputeScoreForUser(user.id);
 return NextResponse.json({ok:true,item:{...item,fuelGrade:grade(item.fuelScore)},targets:t,score});
}
