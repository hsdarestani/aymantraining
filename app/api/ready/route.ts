import {NextResponse} from "next/server";
import {prisma} from "../../../lib/db";

// Public, non-sensitive feature readiness for automated, fail-closed rollouts.
export async function GET(){
 try{
  await prisma.$queryRaw`SELECT 1`;
  return NextResponse.json({
   ok:true,service:"bedifferent",database:"ready",
   stepFeatures:{
    womenDashboard:process.env.WOMEN_DASHBOARD_ENABLED==="true",
    cycleJournal:process.env.CYCLE_JOURNAL_ENABLED==="true",
    milestones:process.env.MILESTONES_ENABLED==="true",
    celebrations:process.env.CELEBRATIONS_ENABLED==="true"
   },
   journey:{
    onboarding:process.env.JOURNEY_ONBOARDING_ENABLED==="true",
    editor:process.env.JOURNEY_EDITOR_ENABLED==="true",
    tests:process.env.JOURNEY_TESTS_ENABLED==="true",
    overview:process.env.JOURNEY_OVERVIEW_ENABLED==="true",
    daily:process.env.JOURNEY_DAILY_ENABLED==="true",
    webOnboarding:process.env.NEXT_PUBLIC_JOURNEY_ONBOARDING_ENABLED==="true",
    webOverview:process.env.NEXT_PUBLIC_JOURNEY_OVERVIEW_ENABLED==="true"
   }
  });
 }catch{
  return NextResponse.json({ok:false,service:"bedifferent",database:"unavailable"},{status:503});
 }
}
