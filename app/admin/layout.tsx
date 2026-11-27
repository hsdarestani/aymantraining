import {requireRole} from "../../lib/auth";
import AdminMobileNav from "../components/AdminMobileNav";
export default async function AdminLayout({children}:{children:React.ReactNode}){const actor=await requireRole(["COACH","ADMIN"]);return <><AdminMobileNav canManageAudio={actor.role==="ADMIN"}/>{children}</>;}