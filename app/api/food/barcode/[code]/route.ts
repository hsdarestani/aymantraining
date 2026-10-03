import {NextResponse} from "next/server";
import {errorJson,requireApiUser} from "../../../../../lib/http";
import {hasFeature} from "../../../../../lib/entitlements";

export async function GET(_:Request,{params}:{params:Promise<{code:string}>}){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(!await hasFeature(user.subscriptionTier,"nutrition_fuel"))return errorJson("Barcode Scan ist PRO.",403);
 const {code}=await params;if(!/^\d{8,14}$/.test(code))return errorJson("Barcode ist ungültig.",422);
 const r=await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=code,product_name,brands,nutriments,nutriscore_grade,image_front_small_url`,{headers:{"user-agent":"BE-DIFFERENT/1.0 (support@bedifferent.smarbiz.sbs)"},next:{revalidate:86400}});
 if(!r.ok)return errorJson("Lebensmittel konnte nicht geladen werden.",502);
 const j:any=await r.json();if(j.status!==1||!j.product)return errorJson("Lebensmittel nicht gefunden.",404);
 const n=j.product.nutriments||{};
 return NextResponse.json({ok:true,product:{code:j.product.code,name:j.product.product_name||"Unbekannt",brand:j.product.brands||"",image:j.product.image_front_small_url||null,officialNutriScore:j.product.nutriscore_grade?.toUpperCase()||null,per100g:{calories:n["energy-kcal_100g"]??null,proteinG:n.proteins_100g??null,carbsG:n.carbohydrates_100g??null,fatG:n.fat_100g??null,sugarG:n.sugars_100g??null}}});
}