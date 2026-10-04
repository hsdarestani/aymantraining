import fs from "node:fs/promises";
import {createReadStream} from "node:fs";
import path from "node:path";
import {Readable} from "node:stream";

const root=()=>path.join(process.env.DATA_DIR||"/app/data","uploads");

function safePath(key:string){
  const normalized=path.normalize(key).replace(/^([.]{2}[\\/])+/, "");
  const filePath=path.join(root(),normalized);
  if(!filePath.startsWith(root()+path.sep)&&filePath!==root())throw new Error("Invalid storage key");
  return filePath;
}

export async function putPrivateObject(key:string,data:Buffer,_mimeType:string){
  const filePath=safePath(key);
  await fs.mkdir(path.dirname(filePath),{recursive:true});
  await fs.writeFile(filePath,data);
  return "local" as const;
}

export async function deletePrivateObject(key:string){
  await fs.unlink(safePath(key)).catch(()=>undefined);
}

export async function getPrivateObject(key:string,range?:string|null){
  const filePath=safePath(key);
  const stat=await fs.stat(filePath);
  let start=0,end=stat.size-1,contentRange:undefined|string;
  if(range){
    const m=/^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if(m){
      if(m[1])start=Math.min(stat.size-1,Number(m[1]));
      if(m[2])end=Math.min(stat.size-1,Number(m[2]));
      if(!m[1]&&m[2])start=Math.max(0,stat.size-Number(m[2]));
      if(end<start)end=start;
      contentRange=`bytes ${start}-${end}/${stat.size}`;
    }
  }
  const stream=createReadStream(filePath,{start,end});
  return {
    body:Readable.toWeb(stream) as ReadableStream,
    size:end-start+1,
    contentRange,
    contentType:undefined,
    source:"local" as const
  };
}
