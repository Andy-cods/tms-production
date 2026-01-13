import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportsClient } from "./_components/reports-client";

export default async function ReportsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;
  if (role !== "ADMIN") {
    redirect("/403");
  }

  return <ReportsClient />;
}

