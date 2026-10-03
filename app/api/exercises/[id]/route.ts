import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
import {errorJson,requireApiUser} from "../../../../lib/http";
import {hasFeature} from "../../../../lib/entitlements";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);const {id}=await params;const item=await prisma.exercise.findFirst({where:{id,active:true}});if(!item)return errorJson("Übung nicht gefunden.",404);if(!item.freeAccess&&!await hasFeature(user.subscriptionTier,"exercise_library_full"))return errorJson("Diese Übung ist PRO.",403);return NextResponse.json({ok:true,item});}