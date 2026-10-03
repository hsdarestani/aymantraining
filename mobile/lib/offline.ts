import AsyncStorage from "@react-native-async-storage/async-storage";
import {api} from "./api";
const KEY="bd_native_outbox";
export type OutboxItem={id:string;path:string;body:unknown;createdAt:number};
export async function enqueue(path:string,body:unknown){const items=await getOutbox();items.push({id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,path,body,createdAt:Date.now()});await AsyncStorage.setItem(KEY,JSON.stringify(items));return items.length}
export async function getOutbox():Promise<OutboxItem[]>{try{const raw=await AsyncStorage.getItem(KEY);const x=raw?JSON.parse(raw):[];return Array.isArray(x)?x:[]}catch{return[]}}
export async function flushOutbox(){const items=await getOutbox();const remaining:OutboxItem[]=[];let sent=0;for(const item of items){try{await api(item.path,{method:"POST",body:JSON.stringify(item.body)});sent++}catch{remaining.push(item)}}await AsyncStorage.setItem(KEY,JSON.stringify(remaining));return {sent,remaining:remaining.length}}
