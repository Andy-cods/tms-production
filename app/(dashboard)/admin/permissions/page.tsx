import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPermissionMatrix } from "@/actions/permissions";
import { PermissionMatrix } from "@/components/admin/permission-matrix";
import { Shield } from "lucide-react";

export default async function PermissionsAdminPage() {
  const session = await auth();

  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  const matrixResult = await getPermissionMatrix();

  if (!matrixResult.success) {
    return (
      <div className="p-6">
        <p className="text-red-600">{matrixResult.error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary-600" />
          Permissions Management
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure role-based access control
        </p>
      </div>

      <PermissionMatrix
        permissions={matrixResult.permissions!}
        matrix={matrixResult.matrix!}
      />
    </div>
  );
}

