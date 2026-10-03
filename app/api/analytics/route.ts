import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../lib/db";
import {getCurrentUser} from "../../../lib/auth";
import {errorJson,isSameOrigin} from "../../../lib/http";
import {captureExternalAnalytics} from "../../../lib/external-analytics";
const schema=z.object({name:z.string().regex(/^[a-z0-9_.-]{2,80}$/),properties:z.record(z.string(),z.union([z.string(),z.number(),z.boolean(),z.null()])).optional()});
export async function POST(request:Request){
  if(!isSameOrigin(request)&&request.headers.get("x-bd-client")!=="mobile")return errorJson("Ungültige Anfrage.",403);
  const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return errorJson("Ungültiges Event.",422);
  const user=await getCurrentUser();
  await Promise.all([
    prisma.analyticsEvent.create({data:{userId:user?.id,name:p.data.name,properties:p.data.properties}}),
    captureExternalAnalytics(user?.id,p.data.name,p.data.properties)
  ]);
  return NextResponse.json({ok:true});
}
