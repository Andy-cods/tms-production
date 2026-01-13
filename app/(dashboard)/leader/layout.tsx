import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
 
export default async function LeaderLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  if (!role || (role !== "LEADER" && role !== "ADMIN")) {
    redirect("/");
  }
 
  return <div className="space-y-4">{children}</div>;
}
 
 


