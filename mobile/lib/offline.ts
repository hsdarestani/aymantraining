import AsyncStorage from "@react-native-async-storage/async-storage";
import {api} from "./api";
import {getSession,getSessionUser} from "./session";
export type OutboxItem={id:string;path:string;body:unknown;createdAt:number};
let pending:Promise<unknown>=Promise.resolve();
function serialized<T>(work:()=>Promise<T>):Promise<T>{const next=pending.then(work,work);pending=next.catch(()=>undefined);return next}
async function read(key:string):Promise<OutboxItem[]>{try{const raw=await AsyncStorage.getItem(key);const items=raw?JSON.parse(raw):[];return Array.isArray(items)?items:[]}catch{return[]}}
async function session(){const [userId,token]=await Promise.all([getSessionUser(),getSession()]);return userId&&token?{key:`bd_native_outbox_v2:${userId}`,token}:null}
export async function enqueue(path:string,body:unknown){const owner=await session();if(!owner)throw new Error("Bitte melde dich erneut an.");return serialized(async()=>{const items=await read(owner.key);items.push({id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,path,body,createdAt:Date.now()});await AsyncStorage.setItem(owner.key,JSON.stringify(items));return items.length})}
export async function getOutbox():Promise<OutboxItem[]>{const owner=await session();return owner?serialized(()=>read(owner.key)):[]}
export async function flushOutbox(){const owner=await session();if(!owner)return {sent:0,remaining:0};return serialized(async()=>{const items=await read(owner.key),remaining:OutboxItem[]=[];let sent=0;for(const item of items){try{await api(item.path,{method:"POST",headers:{authorization:`Bearer ${owner.token}`},body:JSON.stringify(item.body)});sent++}catch{remaining.push(item)}}await AsyncStorage.setItem(owner.key,JSON.stringify(remaining));return {sent,remaining:remaining.length}})}
