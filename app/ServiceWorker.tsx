"use client";
import {useEffect} from "react";

export default function ServiceWorker(){
  useEffect(()=>{
    if(!("serviceWorker" in navigator))return;
    let cancelled=false;
    (async()=>{
      try{
        const registration=await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        if(cancelled)return;
        const response=await fetch("/api/media/preload",{credentials:"include"});
        if(!response.ok)return;
        const data=await response.json();
        const target=registration.active||navigator.serviceWorker.controller;
        if(target&&Array.isArray(data.urls))target.postMessage({type:"PRELOAD_MEDIA",urls:data.urls});
      }catch{}
    })();
    return()=>{cancelled=true};
  },[]);
  return null;
}
