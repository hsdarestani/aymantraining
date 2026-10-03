import { MemberGuard } from "../layout-guard";
export default function DashboardLayout({children}:{children:React.ReactNode}) {
  return <MemberGuard>{children}</MemberGuard>;
}
