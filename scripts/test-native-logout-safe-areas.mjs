import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const session=read("mobile/lib/logout.ts");
const athlete=read("mobile/app/(tabs)/athlete.tsx");
const settings=read("mobile/app/settings.tsx");
const profile=read("mobile/app/profile.tsx");
const login=read("mobile/app/index.tsx");
const tabs=read("mobile/app/(tabs)/_layout.tsx");
const root=read("mobile/app/_layout.tsx");
const dock=read("mobile/components/NativeChrome.tsx");

assert(session.includes('/api/auth/logout'),"Logout must revoke the remote session");
assert(session.includes("await clearSession()"),"Logout must clear on-device credentials");
assert(session.includes('router.replace("/")'),"Logout must return to the login page");
for(const [name,source] of [["ATHLET",athlete],["Settings",settings],["Profile",profile]]){
  assert(source.includes("signOut()"),name+" must use central sign-out");
}
assert(login.includes("useFocusEffect"),"Login must recheck credentials on focus");
assert(login.includes("(await getSession())!==token"),"Late auth calls must not resurrect signed-out sessions");
assert(tabs.includes("authorized===false")&&tabs.includes('<Redirect href="/"/>'),"Tabs require a valid session");
assert(root.includes("useSafeAreaInsets")&&root.includes("topInset"),"Root must respect Android top inset");
assert(root.includes("<LanguagePicker inline/>"),"Language control must be in a reserved header");
assert(dock.includes("s.dock")&&!dock.includes('chrome:{position:"absolute"'),"Internal navigation must have reserved layout space");
assert(dock.includes("paddingBottom:bottomClearance+8"),"Dock must avoid system navigation bar");
assert(dock.includes("keyboardVisible"),"Dock must hide during text input");
console.log("Native session, Android top inset, reserved internal navigation dock: source contracts passed");
