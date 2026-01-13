import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PriorityConfigTable } from "./_components/PriorityConfigTable"
import { PriorityThresholdTable } from "./_components/PriorityThresholdTable"
import { EditConfigDialog } from "./_components/EditConfigDialog"
import { EditThresholdDialog } from "./_components/EditThresholdDialog"
import { AdminPriorityConfigClient } from "./_components/AdminPriorityConfigClient"

export default async function AdminPriorityConfigPage() {
  // RBAC: Only ADMIN role can access
  const session = await auth()
  const user = session?.user as any
  const role = user?.role as string | undefined
  
  if (!role || role !== "ADMIN") {
    redirect("/403")
  }

  // Fetch data
  const [priorityConfigs, priorityThresholds] = await Promise.all([
    prisma.priorityConfig.findMany({
      orderBy: { order: "asc" }
    }),
    prisma.priorityThreshold.findMany({
      orderBy: { minScore: "asc" }
    })
  ])

  return (
    <AdminPriorityConfigClient 
      priorityConfigs={priorityConfigs}
      priorityThresholds={priorityThresholds}
    />
  )
}
