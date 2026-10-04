const STATIC="bd-static-v2";
const MEDIA="bd-exercise-media-v2";

self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith("bd-")&&![STATIC,MEDIA].includes(k)).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));

self.addEventListener("message",event=>{
  const data=event.data||{};
  if(data.type!=="PRELOAD_MEDIA"||!Array.isArray(data.urls))return;
  event.waitUntil((async()=>{
    const cache=await caches.open(MEDIA);
    for(const url of data.urls){
      try{
        const req=new Request(url,{credentials:"include"});
        if(await cache.match(req))continue;
        const res=await fetch(req);
        if(res.ok&&res.headers.get("x-bd-exercise-media")==="1")await cache.put(req,res.clone());
      }catch{}
    }
  })());
});

self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;

  if(url.pathname.startsWith("/_next/static/")){
    event.respondWith(caches.open(STATIC).then(async cache=>{
      const hit=await cache.match(req);
      if(hit)return hit;
      const res=await fetch(req);
      if(res.ok)cache.put(req,res.clone());
      return res;
    }));
    return;
  }

  if(url.pathname.startsWith("/api/media/")&&!url.pathname.endsWith("/preload")){
    event.respondWith((async()=>{
      const cache=await caches.open(MEDIA);
      const hit=await cache.match(req);
      try{
        const res=await fetch(req);
        if(res.ok&&res.headers.get("x-bd-exercise-media")==="1")cache.put(req,res.clone());
        return res;
      }catch{
        return hit||new Response("Offline",{status:503});
      }
    })());
  }
});
