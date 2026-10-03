import {requireRole} from "../../lib/auth";
import AdminMobileNav from "../components/AdminMobileNav";
export default async function AdminLayout({children}:{children:React.ReactNode}){await requireRole(["COACH","ADMIN"]);return <><AdminMobileNav/>{children}</>;}