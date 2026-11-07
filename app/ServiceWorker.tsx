"use client";

import {useEffect} from "react";

export default function ServiceWorker({signedIn}:{signedIn:boolean}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const abort = new AbortController();
    let registration: ServiceWorkerRegistration | undefined;
    let lastCheck = Date.now();

    function checkForRelease() {
      if (document.visibilityState !== "visible" || !navigator.onLine || Date.now() - lastCheck < 60_000) return;
      lastCheck = Date.now();
      void registration?.update().catch(() => {});
    }

    async function register() {
      registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
      if (!signedIn) return;
      const ready = await navigator.serviceWorker.ready;
      if (abort.signal.aborted) return;
      const response = await fetch("/api/media/preload", { cache: "no-store", signal: abort.signal });
      if (!response.ok) return;
      const {urls} = await response.json();
      if (Array.isArray(urls)) ready.active?.postMessage({type: "PRELOAD_MEDIA", urls});
    }

    void register().catch(() => {});
    document.addEventListener("visibilitychange", checkForRelease);
    window.addEventListener("online", checkForRelease);
    return () => {
      abort.abort();
      document.removeEventListener("visibilitychange", checkForRelease);
      window.removeEventListener("online", checkForRelease);
    };
  }, [signedIn]);
  return null;
}
