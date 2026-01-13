import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BulkOperationsClient } from "./_components/bulk-operations-client";

export default async function BulkOperationsPage() {
  const session = await auth();
  
  // RBAC: Only ADMIN or LEADER
  if (!session?.user) {
    redirect("/login");
  }
  
  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN" && userRole !== "LEADER") {
    redirect("/403");
  }

  return <BulkOperationsClient userRole={userRole} />;
}

