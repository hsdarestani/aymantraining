import {redirect} from "next/navigation";
import {requireUser} from "../lib/auth";
import AppNav from "./components/AppNav";

export async function MemberGuard({children}:{children:React.ReactNode}){
  const user=await requireUser();
  if(!user.onboardingCompleted)redirect("/onboarding");
  return <><AppNav/><div className="member-stage">{children}</div></>;
}
