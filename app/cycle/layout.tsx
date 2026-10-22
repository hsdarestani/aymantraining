import {MemberGuard} from "../layout-guard";
export default function CycleLayout({children}:{children:React.ReactNode}){return <MemberGuard>{children}</MemberGuard>;}
