import { requireUser } from "../../lib/auth";
export default async function OnboardingLayout({children}:{children:React.ReactNode}) {
  const user=await requireUser();
  if(user.onboardingCompleted) return <>{children}</>;
  return <>{children}</>;
}
