import {Platform} from "react-native";import Purchases from "react-native-purchases";
let configured=false;
export function billingConfigured(){return Boolean(Platform.OS==="ios"?process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY:process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY);}
export async function configureBilling(userId:string){const key=Platform.OS==="ios"?process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY:process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;if(!key)return false;if(!configured){Purchases.configure({apiKey:key});configured=true;}await Purchases.logIn(userId).catch(()=>undefined);return true;}
export async function availablePackages(){if(!billingConfigured())return [];const offerings=await Purchases.getOfferings();return offerings.current?.availablePackages||[];}
export async function purchasePackage(pkg:any){return Purchases.purchasePackage(pkg);}
export async function restorePurchases(){return Purchases.restorePurchases();}
