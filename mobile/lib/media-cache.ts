import * as FileSystem from "expo-file-system";
import * as Network from "expo-network";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {API,api} from "./api";

const INDEX_KEY="bd_media_cache_index_v1";
const DIR=(FileSystem.cacheDirectory||FileSystem.documentDirectory||"")+"bd-exercise-media/";

type Index=Record<string,string>;

async function index():Promise<Index>{
  try{return JSON.parse((await AsyncStorage.getItem(INDEX_KEY))||"{}")}catch{return{}}
}
async function saveIndex(value:Index){await AsyncStorage.setItem(INDEX_KEY,JSON.stringify(value))}
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
  const idx=await index();
  const path=idx[url];
  if(!path)return url.startsWith("http")?url:API+url;
  const info=await FileSystem.getInfoAsync(path);
  if(info.exists)return path;
  delete idx[url];await saveIndex(idx);
  return url.startsWith("http")?url:API+url;
}
export async function preloadCurrentPlanMedia(){
  const net=await Network.getNetworkStateAsync();
  if(!net.isConnected||net.type!==Network.NetworkStateType.WIFI)return {skipped:true,reason:"wifi"};
  await FileSystem.makeDirectoryAsync(DIR,{intermediates:true}).catch(()=>undefined);
  const manifest=await api<{urls:string[]}>("/api/media/preload");
  const idx=await index();let downloaded=0,failed=0;
  for(const raw of manifest.urls){
    const remote=raw.startsWith("http")?raw:API+raw;
    const existing=idx[raw];
    if(existing&&(await FileSystem.getInfoAsync(existing)).exists)continue;
    const destination=DIR+key(raw)+"."+ext(raw);
    try{
      const result=await FileSystem.downloadAsync(remote,destination);
      if(result.status>=200&&result.status<300){idx[raw]=result.uri;downloaded++}else failed++;
    }catch{failed++}
  }
  await saveIndex(idx);
  return {skipped:false,downloaded,failed,total:manifest.urls.length};
}
export async function clearExerciseMediaCache(){
  await FileSystem.deleteAsync(DIR,{idempotent:true}).catch(()=>undefined);
  await AsyncStorage.removeItem(INDEX_KEY);
}
