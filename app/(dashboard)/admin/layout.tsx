import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminNav } from "./_components/AdminNav";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

  // Only ADMIN can access admin pages
  if (userRole !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sticky top-6">
          <h2 className="text-lg font-bold text-dark-900 mb-4 px-2">
            Quản trị
          </h2>
          <AdminNav />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}

