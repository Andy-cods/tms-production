import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryStatsCard } from "@/components/categories/category-stats-card";

export default async function CategoryAnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get categories with request counts
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    include: {
      requests: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Calculate stats
  const categoryStats = categories.map((cat) => {
    const total = cat.requests.length;
    const completed = cat.requests.filter(
      (r) => r.status === "DONE"
    ).length;
    const active = cat.requests.filter(
      (r) => ["OPEN", "IN_PROGRESS", "IN_REVIEW", "ASSIGNED"].includes(r.status)
    ).length;

    // Calculate avg completion time (for completed requests)
    const completedRequests = cat.requests.filter(
      (r) => r.status === "DONE" && r.updatedAt
    );
    const avgCompletionTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, r) => {
          const hours = (r.updatedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / completedRequests.length
      : undefined;

    return {
      category: {
        id: cat.id,
        name: cat.name,
      },
      stats: {
        totalRequests: total,
        completedRequests: completed,
        activeRequests: active,
        avgCompletionTime,
      },
    };
  }).filter(cs => cs.stats.totalRequests > 0); // Only show categories with requests

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Phân tích theo Danh mục
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Hiệu suất xử lý requests theo từng category
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryStats.map((cs) => (
          <CategoryStatsCard
            key={cs.category.id}
            category={cs.category}
            stats={cs.stats}
          />
        ))}
      </div>

      {categoryStats.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Chưa có dữ liệu phân tích</p>
        </div>
      )}
    </div>
  );
}

