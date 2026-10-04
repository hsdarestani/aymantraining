import {Platform} from "react-native";
import {useCallback,useEffect,useRef,useState} from "react";
import {ErrorCode,useIAP,type Purchase,type SubscriptionProduct} from "react-native-iap";
import {api} from "./api";

export const STORE_PRODUCT_IDS=["bd_pro_monthly","bd_pro_yearly"];

export function useStoreBilling(){
  const [status,setStatus]=useState("");
  const processed=useRef(new Set<string>());
  const finishRef=useRef<((args:any)=>Promise<any>)|null>(null);

  const verifyPurchase=useCallback(async(purchase:Purchase)=>{
    const key=String(purchase.transactionId||purchase.purchaseToken||purchase.id);
    if(processed.current.has(key))return;
    processed.current.add(key);
    setStatus("Kauf wird mit dem Store geprüft…");
    try{
      const result=await api<{ok:boolean;tier:string}>("/api/subscription/verify",{
        method:"POST",
        body:JSON.stringify({
          platform:Platform.OS==="ios"?"ios":"android",
          productId:purchase.productId,
          transactionId:purchase.transactionId||undefined,
          purchaseToken:purchase.purchaseToken||undefined
        })
      });
      if(result.tier!=="PRO"&&result.tier!=="ELITE")throw new Error("Store Kauf ist nicht aktiv.");
      await finishRef.current?.({purchase,isConsumable:false});
      setStatus("PRO aktiviert.");
    }catch(error:any){
      processed.current.delete(key);
      setStatus(error?.message||"Store Verifikation fehlgeschlagen.");
      throw error;
    }
  },[]);

  const iap=useIAP({
    onPurchaseSuccess:async purchase=>{await verifyPurchase(purchase).catch(()=>undefined)},
    onPurchaseError:error=>{
      if(error.code===ErrorCode.E_USER_CANCELLED){setStatus("Kauf abgebrochen.");return}
      setStatus(error.message||"Kauf konnte nicht abgeschlossen werden.");
    }
  });
  finishRef.current=iap.finishTransaction;

  useEffect(()=>{
    if(!iap.connected)return;
    iap.fetchProducts({skus:STORE_PRODUCT_IDS,type:"subs"}).catch(()=>undefined);
  },[iap.connected]);

  useEffect(()=>{
    if(!iap.availablePurchases?.length)return;
    (async()=>{
      let valid=0;
      for(const purchase of iap.availablePurchases){
        if(!STORE_PRODUCT_IDS.includes(purchase.productId))continue;
        try{await verifyPurchase(purchase);valid++}catch{}
      }
      if(valid>0)setStatus("Käufe wiederhergestellt.");
    })();
  },[iap.availablePurchases,verifyPurchase]);

  async function buy(product:SubscriptionProduct){
    setStatus("Store wird geöffnet…");
    const p:any=product;
    const androidOffers=(p.subscriptionOfferDetailsAndroid||[]).map((offer:any)=>({sku:product.id,offerToken:offer.offerToken}));
    await iap.requestPurchase({
      request:{
        ios:{sku:product.id},
        android:{skus:[product.id],subscriptionOffers:androidOffers}
      },
      type:"subs"
    });
  }

  async function restore(){
    setStatus("Käufe werden wiederhergestellt…");
    processed.current.clear();
    await iap.restorePurchases();
    await api("/api/subscription/sync",{method:"POST",body:"{}"}).catch(()=>undefined);
  }

  return {
    connected:iap.connected,
    products:iap.subscriptions||[],
    status,
    setStatus,
    buy,
    restore
  };
}
