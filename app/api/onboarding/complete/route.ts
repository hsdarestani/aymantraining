import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser,safeIpHash,dateOnly} from "../../../../lib/http";
import {recomputeScoreForUser} from "../../../../lib/scoring";
import {JOURNEY_LEVELS} from "../../../../lib/journey-contract";
import {canonicalOnboardingGoals,initialExperienceForLevel} from "../../../../lib/journey-onboarding";

const legacySchema=z.object({
  goal:z.string().min(2).max(80).optional(),
  goals:z.array(z.string().min(2).max(80)).min(1).max(6).optional(),
  selfLevel:z.enum(JOURNEY_LEVELS).optional(),
  dashboard:z.enum(["GENERAL","WOMEN"]).optional(),
  birthDate:z.string().date(),
  sex:z.enum(["female","male","diverse","prefer_not_to_say"]),
  heightCm:z.number().min(100).max(250),
  weightKg:z.number().min(25).max(400),
  trainingExperience:z.enum(["STARTER","REGULAR","ADVANCED"]),
  availabilityPerWeek:z.number().int().min(1).max(7),
  healthConsent:z.boolean(),
  privacyConsent:z.literal(true),
  termsConsent:z.literal(true),
  pushups:z.number().int().min(0).max(500).optional(),
  plankSeconds:z.number().int().min(0).max(3600).optional(),
  run5kMinutes:z.number().min(10).max(180).optional()
}).refine(data=>Boolean(data.goal)||Boolean(data.goals?.length),{message:"Mindestens ein Ziel ist erforderlich."})
  .refine(data=>!data.goals||Boolean(data.selfLevel),{message:"Bitte wähle eines der fünf Einstiegslevel."});

function ageOn(date:Date){
  const now=new Date();let age=now.getUTCFullYear()-date.getUTCFullYear();
  const m=now.getUTCMonth()-date.getUTCMonth();
  if(m<0||(m===0&&now.getUTCDate()<date.getUTCDate()))age--;
  return age;
}

/**
 * Keep older mobile clients working unchanged. The new journey database must
 * be migrated BEFORE enabling JOURNEY_ONBOARDING_ENABLED=true on the server.
 */
export async function POST(request:Request){
  if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
  const user=await requireApiUser();
  if(!user)return errorJson("Nicht angemeldet.",401);
  const parsed=legacySchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return errorJson("Bitte vervollständige alle Pflichtangaben.",422);
  const data=parsed.data;
  const modern=Boolean(data.goals);
  if(modern&&process.env.JOURNEY_ONBOARDING_ENABLED!=="true")
    return errorJson("Der neue Trainingsweg wird noch vorbereitet. Bitte später erneut versuchen.",503,"JOURNEY_NOT_ENABLED");

  let selected:string[]=[];
  if(modern){
    try{selected=canonicalOnboardingGoals(data.goals!);}
    catch{return errorJson("Bitte wähle gültige, unterschiedliche Ziele.",422);}
  }
  if(modern&&data.dashboard==="WOMEN"&&data.sex!=="female")
    return errorJson("Die optionale Frauenansicht kann hier nur bei Auswahl weiblich vorgeschlagen werden.",422);
  const birthDate=new Date(data.birthDate);
  if(Number.isNaN(birthDate.getTime())||ageOn(birthDate)<16)
    return errorJson("BE DIFFERENT ist zum Launch ab 16 Jahren verfügbar.",403);
  const ipHash=safeIpHash(request);
  if(modern){
    const current=await prisma.journeyIntake.findUnique({where:{userId:user.id}});
    if(current){
      const identical=current.selfLevel===data.selfLevel&&current.dashboard===(data.dashboard??"GENERAL")&&
        [...current.selectedGoalSlugs].sort().join("|")===selected.join("|");
      if(!identical)return errorJson("Dein Einstieg wurde bereits erfasst. Änderungen werden vom Coach geprüft.",409);
      return NextResponse.json({ok:true,journey:{
        status:current.status,selfLevel:current.selfLevel,dashboard:current.dashboard,
        selectedGoals:current.selectedGoalSlugs,matchedVersionId:current.matchedVersionId
      },replayed:true});
    }
    // Avoid overwriting existing legacy onboarding and completed plans.
    if(user.onboardingCompleted)
      return errorJson("Bestehende Nutzer wechseln nach Prüfung durch den Coach in den neuen Trainingsweg.",409);
  }
  const summary=await prisma.$transaction(async tx=>{
    let journey:null|{status:"PENDING_PATHWAY"|"PENDING_PLACEMENT";matchedVersionId:string|null}=null;
    if(modern){
      const candidates=await tx.journeyPathwayVersion.findMany({
        where:{state:"PUBLISHED",goalSlugs:{hasEvery:selected},pathway:{active:true}},
        select:{id:true,goalSlugs:true},orderBy:[{publishedAt:"desc"},{version:"desc"}]
      });
      const match=candidates.find(v=>v.goalSlugs.length===selected.length)??null;
      const status=match?"PENDING_PLACEMENT":"PENDING_PATHWAY";
      await tx.journeyIntake.create({data:{
        userId:user.id,selectedGoalSlugs:selected,selfLevel:data.selfLevel!,
        dashboard:data.dashboard??"GENERAL",status,matchedVersionId:match?.id??null
      }});
      if(match){
        await tx.journeyEnrollment.create({data:{
          userId:user.id,versionId:match.id,selfLevel:data.selfLevel!,state:"PENDING"
        }});
      }
      journey={status,matchedVersionId:match?.id??null};
    }
    await tx.user.update({where:{id:user.id},data:{
      birthDate,sex:data.sex,heightCm:data.heightCm,
      trainingExperience:modern?initialExperienceForLevel(data.selfLevel!):data.trainingExperience,
      availabilityPerWeek:data.availabilityPerWeek,onboardingCompleted:true
    }});
    await tx.goal.updateMany({where:{userId:user.id,active:true},data:{active:false}});
    if(modern)await tx.goal.createMany({data:selected.map(type=>({userId:user.id,type}))});
    else await tx.goal.create({data:{userId:user.id,type:data.goal!}});
    await tx.bodyMetric.create({data:{userId:user.id,date:dateOnly(),weightKg:data.weightKg}});
    for(const [type,granted] of [["privacy",true],["terms",true],["health_data",data.healthConsent]] as const){
      await tx.consentRecord.create({data:{userId:user.id,type,version:"1.0",granted,ipHash}});
    }
    const results=[] as {metric:string;value:number;unit:string}[];
    if(data.pushups!=null)results.push({metric:"pushups",value:data.pushups,unit:"reps"});
    if(data.plankSeconds!=null)results.push({metric:"plank",value:data.plankSeconds,unit:"seconds"});
    if(data.run5kMinutes!=null)results.push({metric:"5k_time",value:data.run5kMinutes,unit:"minutes"});
    if(results.length)await tx.performanceTest.create({data:{
      userId:user.id,name:"START TEST",completedAt:new Date(),results:{create:results}
    }});
    return journey;
  });
  const score=await recomputeScoreForUser(user.id);
  return NextResponse.json({ok:true,score,journey:modern?{
    ...summary,selfLevel:data.selfLevel,selectedGoals:selected,dashboard:data.dashboard??"GENERAL",
    confirmedLevel:null,notice:"Selbsteinschätzung gespeichert. Kein Level freigeschaltet."
  }:undefined});
}
