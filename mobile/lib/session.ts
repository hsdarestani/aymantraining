import * as SecureStore from "expo-secure-store";
const KEY="bd_session_token",OWNER="bd_session_user";
export const getSession=()=>SecureStore.getItemAsync(KEY);
export const getSessionUser=()=>SecureStore.getItemAsync(OWNER);
export async function setSession(token:string,userId:string){
 await SecureStore.setItemAsync(OWNER,userId,{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});
 await SecureStore.setItemAsync(KEY,token,{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});
}
export async function clearSession(){await SecureStore.deleteItemAsync(KEY);await SecureStore.deleteItemAsync(OWNER)}
