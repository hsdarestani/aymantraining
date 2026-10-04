import {NextResponse} from "next/server";
import {z} from "zod";
import {errorJson,isSameOrigin,requireApiUser} from "../../../../lib/http";
import {applyStoreVerification,verifyAppleSubscription,verifyGoogleSubscription} from "../../../../lib/store-billing";

const schema=z.object({
  platform:z.enum(["ios","android"]),
  productId:z.string().min(2).max(200),
  transactionId:z.string().max(300).optional().nullable(),
  purchaseToken:z.string().max(10000).optional().nullable()
});

export async function POST(request:Request){
  if(!isSameOrigin(request)&&request.headers.get("x-bd-client")!=="mobile")return errorJson("Ungültige Anfrage.",403);
  const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorJson("Ungültige Store Transaktion.",422);
  try{
    const result=parsed.data.platform==="ios"
      ?await verifyAppleSubscription(parsed.data.transactionId||"")
      :await verifyGoogleSubscription(parsed.data.purchaseToken||"");
    if(result.productId!==parsed.data.productId)return errorJson("Produkt stimmt nicht mit Store Transaktion überein.",422);
    const tier=await applyStoreVerification(user.id,result);
    return NextResponse.json({ok:true,tier,result:{provider:result.provider,productId:result.productId,status:result.status,renewsAt:result.renewsAt,environment:result.environment}});
  }catch(error){
    console.error("Store verification failed",error);
    return errorJson(error instanceof Error?error.message:"Store Verifikation fehlgeschlagen.",502);
  }
}
