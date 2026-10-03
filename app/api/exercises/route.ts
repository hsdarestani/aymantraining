import {NextResponse} from "next/server";
import {prisma} from "../../../lib/db";
import {errorJson,requireApiUser} from "../../../lib/http";
import {hasFeature} from "../../../lib/entitlements";
export async function GET(request:Request){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const full=await hasFeature(user.subscriptionTier,"exercise_library_full");
 const url=new URL(request.url);const q=url.searchParams.get("q")?.trim();const category=url.searchParams.get("category")?.trim();
 const items=await prisma.exercise.findMany({where:{active:true,...(!full?{freeAccess:true}:{}),...(category?{category}:{}),...(q?{OR:[{nameDe:{contains:q,mode:"insensitive"}},{nameEn:{contains:q,mode:"insensitive"}},{equipment:{contains:q,mode:"insensitive"}}]}:{})},orderBy:[{category:"asc"},{nameDe:"asc"}],take:250});
 return NextResponse.json({ok:true,full,items});
}