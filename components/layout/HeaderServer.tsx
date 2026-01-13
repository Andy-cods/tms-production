import { auth } from "@/lib/auth";
import Header from "./Header";

export default async function HeaderServer() {
  const session = await auth();
  const userName = session?.user?.name || session?.user?.email || undefined;
  const userRole = (session?.user as any)?.role as string | undefined;
  
  return <Header userName={userName} userRole={userRole} />;
}

