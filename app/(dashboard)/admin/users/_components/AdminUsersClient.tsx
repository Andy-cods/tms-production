'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModernUserTable } from './ModernUserTable';
import { AddUserModal } from '@/components/admin/add-user-modal';

interface AdminUsersClientProps {
  users: any[];
  teams: any[];
  positions: string[];
  initialSearch: string;
  initialRoleFilter: string;
  initialStatusFilter: string;
  initialPositionFilter?: string;
}

export function AdminUsersClient({
  users,
  teams,
  positions,
  initialSearch,
  initialRoleFilter,
  initialStatusFilter,
  initialPositionFilter = "all",
}: AdminUsersClientProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-600 mt-1">Tổng {users.length} người dùng</p>
        </div>
        
        <Button
          className="bg-primary-500 hover:bg-primary-600 text-white font-medium"
          onClick={() => setIsAddModalOpen(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Thêm người dùng
        </Button>
      </div>

      {/* Table */}
      <ModernUserTable
        users={users}
        teams={teams}
        positions={positions}
        initialSearch={initialSearch}
        initialRoleFilter={initialRoleFilter}
        initialStatusFilter={initialStatusFilter}
      />
      
      {/* Add User Modal */}
      <AddUserModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </div>
  );
}
