// app/(dashboard)/requests/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth-helpers";
import Link from "next/link";
import { Plus, FolderOpen, Clock, CheckCircle, Inbox as InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { RequestFilters } from "./_components/RequestFilters";
import { RequestTable } from "./_components/RequestTable";
import { RequestSearchClient } from "./_components/RequestSearchClient";

interface SearchParams {
  // Basic filters
  status?: string;
  priority?: string;
  q?: string;
  page?: string;
  order?: string;
  dir?: string;
  // Advanced filters
  categoryId?: string;
  creatorId?: string;
  teamId?: string;
  tags?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  deadlineFrom?: string;
  deadlineTo?: string;
  hasOverdue?: string;
}

export default async function RequestsPage({ 
  searchParams 
}: { 
  searchParams: Promise<SearchParams> 
}) {
  const sp = await searchParams;
  
  // Auth check
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  
  // Get current user info for authorization
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      id: true,
      role: true,
      teamId: true
    }
  });
  
  console.log(`[Requests Page] User role: ${currentUser?.role}, teamId: ${currentUser?.teamId}`);
  
  // Check if advanced search is being used
  const hasAdvancedFilters = !!(
    sp.categoryId || sp.creatorId || sp.teamId || sp.tags || 
    sp.createdAtFrom || sp.createdAtTo || sp.deadlineFrom || sp.deadlineTo || sp.hasOverdue
  );

  // Fetch options for advanced search
  const [categories, users, teams] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.user.findMany({ select: { id: true, name: true, email: true } }),
    prisma.team.findMany({ select: { id: true, name: true } }),
  ]);

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));
  const userOptions = users.map(u => ({ value: u.id, label: u.name || u.email }));
  const teamOptions = teams.map(t => ({ value: t.id, label: t.name }));

  // If advanced filters are used, delegate to client component
  if (hasAdvancedFilters) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark-900">Yêu cầu</h1>
            <p className="text-gray-600 mt-1">Tìm kiếm nâng cao</p>
          </div>
          <Link href="/requests/new">
            <Button>
              <Plus className="h-4 w-4" />
              Tạo yêu cầu mới
            </Button>
          </Link>
        </div>

        <RequestSearchClient 
          initialParams={sp as Record<string, string | undefined>}
          categories={categoryOptions}
          users={userOptions}
          teams={teamOptions}
        />
      </div>
    );
  }

  // Otherwise, use simple server-side filtering (existing behavior)
  const status = sp.status && ['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'REJECTED', 'ARCHIVED'].includes(sp.status) 
    ? sp.status : undefined;
  const priority = sp.priority && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(sp.priority) 
    ? sp.priority : undefined;
  const search = sp.q?.trim() || undefined;
  const page = Math.max(1, parseInt(sp.page || '1'));
  const order = sp.order === 'deadline' ? 'deadline' : 'createdAt';
  const dir = sp.dir === 'asc' ? 'asc' : 'desc';
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  // Build where clause with role-based authorization
  // Import and use permission helper
  const { buildRequestWhereClause } = await import("@/lib/queries/request-access");
  const userId = currentUser?.id || getUserId(session);
  const userRole = currentUser?.role || (session.user as any).role;
  const where = buildRequestWhereClause(
    userId,
    userRole,
    {},
    { teamId: currentUser?.teamId }
  );
  
  // Apply status filter
  if (status) {
    where.status = status;
  } else {
    // Exclude archived requests by default
    where.status = { not: 'ARCHIVED' };
  }
  
  // Apply other filters
  if (priority) where.priority = priority;
  if (search) {
    // Merge OR with existing OR if any
    const orConditions = [
      { title: { contains: search, mode: 'insensitive' as const } },
      { description: { contains: search, mode: 'insensitive' as const } }
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: orConditions }];
      delete where.OR;
    } else {
      where.OR = orConditions;
    }
  }

  // Query with pagination
  const [items, total] = await Promise.all([
    prisma.request.findMany({
      where,
      orderBy: { [order]: dir },
      skip,
      take: pageSize,
      select: {
        id: true, 
        title: true, 
        priority: true, 
        status: true, 
        createdAt: true, 
        deadline: true,
        category: { 
          select: { 
            id: true,
            name: true,
          } 
        },
        creator: { select: { name: true } },
      },
    }),
    prisma.request.count({ where })
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // Calculate stats with role-based authorization
  const statsWhere = buildRequestWhereClause(
    userId,
    userRole,
    { status: { not: 'ARCHIVED' } },
    { teamId: currentUser?.teamId }
  );
  
  const stats = await prisma.request.groupBy({
    by: ['status'],
    where: statsWhere,
    _count: true,
  });

  const totalRequests = stats.reduce((sum, s) => sum + s._count, 0);
  const pendingCount = stats.find(s => s.status === 'OPEN')?._count || 0;
  const inProgressCount = stats.find(s => s.status === 'IN_PROGRESS')?._count || 0;
  const doneCount = stats.find(s => s.status === 'DONE')?._count || 0;
  
  console.log(`[Requests Page] Found ${total} requests for user role: ${currentUser?.role}`);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-900">Yêu cầu</h1>
          <p className="text-gray-600 mt-1">Quản lý và theo dõi tất cả yêu cầu</p>
        </div>
        <Link href="/requests/new">
          <Button className="bg-primary-500 hover:bg-primary-600 text-white shadow-sm">
            <Plus className="h-4 w-4" />
            Tạo yêu cầu mới
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Tổng yêu cầu"
          value={totalRequests}
          icon={FolderOpen}
        />
        <StatsCard
          title="Chờ xử lý"
          value={pendingCount}
          icon={InboxIcon}
        />
        <StatsCard
          title="Đang xử lý"
          value={inProgressCount}
          icon={Clock}
        />
        <StatsCard
          title="Hoàn thành"
          value={doneCount}
          icon={CheckCircle}
        />
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <RequestFilters 
          currentStatus={status}
          currentPriority={priority}
          currentSearch={search}
          currentOrder={order}
          currentDir={dir}
        />
        
        {/* Link to advanced search */}
        <div className="text-sm text-gray-600 mt-4">
          Cần thêm bộ lọc? <Link href={`/requests?categoryId=&advanced=true`} className="text-primary-600 hover:text-primary-700 font-medium underline">Sử dụng tìm kiếm nâng cao</Link>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Tìm thấy <span className="font-semibold text-dark-900">{total}</span> kết quả
        </p>
      </div>

      {/* Table */}
      <RequestTable 
        items={items}
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        searchQuery={search}
      />
    </div>
  );
}
