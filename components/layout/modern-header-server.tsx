import { auth } from "@/lib/auth";
import ModernHeader from "./modern-header";

export default async function ModernHeaderServer() {
  const session = await auth();
  const userName = session?.user?.name || session?.user?.email || undefined;
  const userRole = (session?.user as any)?.role as string | undefined;
  
  return <ModernHeader userName={userName} userRole={userRole} />;
}
