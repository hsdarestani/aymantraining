import * as FileSystem from "expo-file-system";
import * as Network from "expo-network";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {API,api} from "./api";
import {getSession,getSessionUser} from "./session";

const PREFIX="bd_media_cache_index_v2_";
const BASE=(FileSystem.cacheDirectory||FileSystem.documentDirectory||"")+"bd-exercise-media/";
async function scope(){
  const userId=await getSessionUser();
  if(!userId)return null;
  const safe=userId.replace(/[^a-zA-Z0-9_-]/g,"").slice(0,90);
  if(!safe)return null;
  return {index:PREFIX+safe,dir:BASE+safe+"/"};
}

type Index=Record<string,string>;

async function index():Promise<Index>{
 const s=await scope();if(!s)return {};
 try{return JSON.parse((await AsyncStorage.getItem(s.index))||"{}")}catch{return{}}
}
async function saveIndex(value:Index){const s=await scope();if(s)await AsyncStorage.setItem(s.index,JSON.stringify(value));}
function ext(url:string){
  const clean=url.split("?")[0].toLowerCase();
  const m=clean.match(/\.([a-z0-9]{2,5})$/);
  return m?.[1]||"bin";
}
function key(url:string){
  let hash=2166136261;
  for(let i=0;i<url.length;i++){hash^=url.charCodeAt(i);hash=Math.imul(hash,16777619)}
  return (hash>>>0).toString(16);
}
export async function localMediaUri(url:string){
  const remote=url.startsWith("http")?url:API+url;
  const s=await scope();const token=await getSession();
  if(!s||!token)return remote;
  const idx=await index(),cached=idx[url];
  if(cached){
    const info=await FileSystem.getInfoAsync(cached);
    if(info.exists)return cached;
    delete idx[url];await saveIndex(idx);
  }
  // Only own API files get bearer headers. Never send auth to a remote CDN/domain.
  if(!url.startsWith("/api/media/"))return remote;
  await FileSystem.makeDirectoryAsync(s.dir,{intermediates:true}).catch(()=>undefined);
  const dest=s.dir+key(url)+"."+ext(url);
  try{
    const result=await FileSystem.downloadAsync(remote,dest,{headers:{Authorization:"Bearer "+token}});
    if(result.status>=200&&result.status<300){
      idx[url]=result.uri;await saveIndex(idx);return result.uri;
    }
  }catch{}
  return remote;
}
export async function preloadCurrentPlanMedia(){
  const net=await Network.getNetworkStateAsync();
  if(!net.isConnected||net.type!==Network.NetworkStateType.WIFI)return {skipped:true,reason:"wifi"};
  const s=await scope(),token=await getSession();
  if(!s||!token)return {skipped:true,reason:"no_session"};
  await FileSystem.makeDirectoryAsync(s.dir,{intermediates:true}).catch(()=>undefined);
  const manifest=await api<{urls:string[]}>("/api/media/preload");
  const idx=await index();let downloaded=0,failed=0;
  for(const raw of manifest.urls){
    const remote=raw.startsWith("http")?raw:API+raw;
    const existing=idx[raw];
    if(existing&&(await FileSystem.getInfoAsync(existing)).exists)continue;
    const destination=s.dir+key(raw)+"."+ext(raw);
    try{
      const headers=raw.startsWith("/api/media/")?{Authorization:"Bearer "+token}:undefined;
      const result=await FileSystem.downloadAsync(remote,destination,headers?{headers}:undefined);
      if(result.status>=200&&result.status<300){idx[raw]=result.uri;downloaded++}else failed++;
    }catch{failed++}
  }
  await saveIndex(idx);
  return {skipped:false,downloaded,failed,total:manifest.urls.length};
}
export async function clearExerciseMediaCache(){
  const s=await scope();if(!s)return;
  await FileSystem.deleteAsync(s.dir,{idempotent:true}).catch(()=>undefined);
  await AsyncStorage.removeItem(s.index);
}
