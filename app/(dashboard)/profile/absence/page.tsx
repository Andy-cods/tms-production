import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAbsenceStatus, getAvailableUsers } from "@/actions/absence";
import AbsenceClient from "@/components/profile/absence-client";

export default async function AbsencePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const [absenceResult, usersResult] = await Promise.all([
    getAbsenceStatus(),
    getAvailableUsers()
  ]);

  if (!absenceResult.success || !usersResult.success) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            Không thể tải trang quản lý vắng mặt
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Quản lý vắng mặt
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Thiết lập thời gian vắng mặt và ủy quyền công việc
        </p>
      </div>

      <AbsenceClient 
        currentAbsence={absenceResult.data || null}
        availableUsers={usersResult.data || []}
      />
    </div>
  );
}

