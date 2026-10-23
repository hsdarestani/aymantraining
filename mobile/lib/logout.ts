import {router} from "expo-router";
import {api} from "./api";
import {clearSession} from "./session";

// A single logout path for ATHLET, Profile and Settings. Always clear the
// local credentials, even when the device is offline and revocation times out.
let pending:Promise<void>|null=null;
export function signOut():Promise<void>{
  if(pending)return pending;
  pending=(async()=>{
    try{
      await api("/api/auth/logout",{method:"POST",body:"{}"});
    }catch{
      // Local logout must not depend on connectivity to the API.
    }finally{
      await clearSession();
    }
    // Dismiss private nested screens and show the actual login form.
    router.dismissAll();
    router.replace("/");
  })().finally(()=>{pending=null});
  return pending;
}
