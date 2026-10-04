import fs from "node:fs/promises";
import path from "node:path";
import {DeleteObjectCommand,GetObjectCommand,PutObjectCommand,S3Client} from "@aws-sdk/client-s3";
import {integrationStatus} from "./integrations";

let client:S3Client|undefined;
function r2(){
  if(!integrationStatus().r2) return null;
  if(!client) client=new S3Client({
    region:"auto",
    endpoint:`https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials:{accessKeyId:process.env.R2_ACCESS_KEY_ID!,secretAccessKey:process.env.R2_SECRET_ACCESS_KEY!}
  });
  return client;
}
const bucket=()=>process.env.R2_BUCKET!;

export async function putPrivateObject(key:string,data:Buffer,mimeType:string){
  const c=r2();
  if(c){
    await c.send(new PutObjectCommand({Bucket:bucket(),Key:key,Body:data,ContentType:mimeType,CacheControl:"private, no-store"}));
    return "r2" as const;
  }
  const dir=path.join(process.env.DATA_DIR||"/app/data","uploads");
  const filePath=path.join(dir,key);
  await fs.mkdir(path.dirname(filePath),{recursive:true});
  await fs.writeFile(filePath,data);
  return "local" as const;
}

export async function deletePrivateObject(key:string){
  const c=r2();
  if(c){await c.send(new DeleteObjectCommand({Bucket:bucket(),Key:key})).catch(()=>undefined);return;}
  await fs.unlink(path.join(process.env.DATA_DIR||"/app/data","uploads",key)).catch(()=>undefined);
}

export async function getPrivateObject(key:string,range?:string|null){
  const c=r2();
  if(c){
    const result=await c.send(new GetObjectCommand({Bucket:bucket(),Key:key,Range:range||undefined}));
    return {
      body:result.Body?.transformToWebStream()||null,
      size:result.ContentLength,
      contentRange:result.ContentRange,
      contentType:result.ContentType,
      source:"r2" as const
    };
  }
  const filePath=path.join(process.env.DATA_DIR||"/app/data","uploads",key);
  const data=await fs.readFile(filePath);
  return {body:new Blob([data]).stream(),size:data.length,contentRange:undefined,contentType:undefined,source:"local" as const};
}
