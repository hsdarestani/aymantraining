import crypto from "node:crypto";
import fs from "node:fs/promises";
import {createReadStream} from "node:fs";
import path from "node:path";
import {Readable} from "node:stream";

const root=()=>path.join(process.env.DATA_DIR||"/app/data","uploads");
const MAGIC=Buffer.from("BDENC1");
const IV_BYTES=12;
const TAG_BYTES=16;

function safePath(key:string){
  const normalized=path.normalize(key).replace(/^([.]{2}[\\/])+/, "");
  const filePath=path.join(root(),normalized);
  if(!filePath.startsWith(root()+path.sep)&&filePath!==root())throw new Error("Invalid storage key");
  return filePath;
}
function encryptionKey(){
  const direct=process.env.MEDIA_ENCRYPTION_KEY_B64;
  if(direct){
    const key=Buffer.from(direct,"base64");
    if(key.length===32)return key;
  }
  const seed=process.env.CRON_SECRET;
  if(!seed)throw new Error("Media encryption key unavailable");
  return crypto.createHash("sha256").update(seed+":be-different-media-v1").digest();
}
function encrypt(data:Buffer){
  const iv=crypto.randomBytes(IV_BYTES),cipher=crypto.createCipheriv("aes-256-gcm",encryptionKey(),iv);
  const body=Buffer.concat([cipher.update(data),cipher.final()]),tag=cipher.getAuthTag();
  return Buffer.concat([MAGIC,iv,tag,body]);
}
function decrypt(data:Buffer){
  if(!data.subarray(0,MAGIC.length).equals(MAGIC))return null;
  const iv=data.subarray(MAGIC.length,MAGIC.length+IV_BYTES);
  const tag=data.subarray(MAGIC.length+IV_BYTES,MAGIC.length+IV_BYTES+TAG_BYTES);
  const body=data.subarray(MAGIC.length+IV_BYTES+TAG_BYTES);
  const decipher=crypto.createDecipheriv("aes-256-gcm",encryptionKey(),iv);decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body),decipher.final()]);
}
export class InvalidMediaRange extends Error {
  constructor(public readonly size: number) { super("Unsatisfiable media range"); }
}
function rangeFor(size:number,range?:string|null){
  let start=0,end=Math.max(0,size-1),contentRange:undefined|string;
  if(range){
    const m=/^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if(!m||(!m[1]&&!m[2])||!size)throw new InvalidMediaRange(size);
    if(!m[1]){
      const suffix=Number(m[2]);
      if(!Number.isSafeInteger(suffix)||suffix<=0)throw new InvalidMediaRange(size);
      start=Math.max(0,size-suffix);
    }else{
      start=Number(m[1]);
      if(!Number.isSafeInteger(start)||start>=size)throw new InvalidMediaRange(size);
      if(m[2]){
        const requestedEnd=Number(m[2]);
        if(!Number.isSafeInteger(requestedEnd)||requestedEnd<start)throw new InvalidMediaRange(size);
        end=Math.min(size-1,requestedEnd);
      }
    }
    contentRange=`bytes ${start}-${end}/${size}`;
  }
  return {start,end,contentRange};
}

export async function putPrivateObject(key:string,data:Buffer,_mimeType:string,sensitive=false){
  const filePath=safePath(key);
  await fs.mkdir(path.dirname(filePath),{recursive:true});
  await fs.writeFile(filePath,sensitive?encrypt(data):data);
  return "local" as const;
}
export async function deletePrivateObject(key:string){await fs.unlink(safePath(key)).catch(()=>undefined);}

export async function encryptPrivateObjectIfNeeded(key:string){
  const filePath=safePath(key),raw=await fs.readFile(filePath);
  if(raw.subarray(0,MAGIC.length).equals(MAGIC))return false;
  const temp=filePath+".enc";
  await fs.writeFile(temp,encrypt(raw));
  await fs.rename(temp,filePath);
  return true;
}

export async function getPrivateObject(key:string,range?:string|null){
  const filePath=safePath(key);
  const head=await fs.open(filePath,"r").then(async h=>{try{const b=Buffer.alloc(MAGIC.length);await h.read(b,0,b.length,0);return b}finally{await h.close()}});

  if(head.equals(MAGIC)){
    const raw=await fs.readFile(filePath),plain=decrypt(raw);
    if(!plain)throw new Error("Encrypted media cannot be decrypted");
    const {start,end,contentRange}=rangeFor(plain.length,range);
    const slice=plain.subarray(start,end+1);
    return {body:Readable.toWeb(Readable.from(slice)) as ReadableStream,size:slice.length,contentRange,contentType:undefined,source:"local" as const,encrypted:true};
  }

  const stat=await fs.stat(filePath),{start,end,contentRange}=rangeFor(stat.size,range);
  const stream=createReadStream(filePath,{start,end});
  return {body:Readable.toWeb(stream) as ReadableStream,size:end-start+1,contentRange,contentType:undefined,source:"local" as const,encrypted:false};
}
