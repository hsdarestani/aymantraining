import {MemberGuard} from "../layout-guard";
export default function JourneyLayout({children}:{children:React.ReactNode}){return <MemberGuard>{children}</MemberGuard>;}
