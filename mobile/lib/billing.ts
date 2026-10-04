import {useState} from "react";

export const STORE_PRODUCT_IDS=["bd_pro_monthly","bd_pro_yearly"];

export function useStoreBilling(){
  const [status,setStatus]=useState("");
  async function buy(_product?:any){setStatus("Die Store Zahlung wird in der Zahlungsphase aktiviert.")}
  async function restore(){setStatus("Die Wiederherstellung wird in der Zahlungsphase aktiviert.")}
  return {connected:false,products:[] as any[],status,setStatus,buy,restore};
}
