import {requireUser} from "../lib/auth";
import AppNav from "./components/AppNav";
export async function MemberGuard({children}:{children:React.ReactNode}){await requireUser();return <><AppNav/>{children}</>;}