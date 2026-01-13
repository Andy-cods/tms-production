import Sidebar from "./Sidebar";
import { auth } from "@/lib/auth";

export default async function SidebarServer() {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  const userName = session?.user?.name || session?.user?.email || undefined;
  return <Sidebar role={role} userName={userName} />;
}


