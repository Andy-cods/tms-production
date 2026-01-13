"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TeamCard } from "@/components/admin/team-card";
import { TeamDialog } from "@/components/admin/team-dialog";
import { TeamMembersManager } from "@/components/admin/team-members-manager";
import { useRouter } from "next/navigation";

interface Team {
  id: string;
  name: string;
  description: string | null;
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  _count: {
    requests: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string | null;
}

interface Props {
  teams: Team[];
  leaders: User[];
  allUsers: User[];
}

export function TeamManagementClient({ teams, leaders, allUsers }: Props) {
  const router = useRouter();
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [teamDialogMode, setTeamDialogMode] = useState<"create" | "edit">("create");
  const [selectedTeam, setSelectedTeam] = useState<Team | undefined>();
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [membersDialogTeam, setMembersDialogTeam] = useState<Team | null>(null);

  const handleCreateTeam = () => {
    setTeamDialogMode("create");
    setSelectedTeam(undefined);
    setTeamDialogOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setTeamDialogMode("edit");
    setSelectedTeam(team);
    setTeamDialogOpen(true);
  };

  const handleManageMembers = (team: Team) => {
    setMembersDialogTeam(team);
    setMembersDialogOpen(true);
  };

  const totalMembers = teams.reduce((sum, t) => sum + t.members.length, 0);
  const totalRequests = teams.reduce((sum, t) => sum + t._count.requests, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">Quản lý đội ngũ và phân công</p>
        </div>
        <Button onClick={handleCreateTeam}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo team mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Tổng số team</p>
          <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">Tổng thành viên</p>
          <p className="text-2xl font-bold text-blue-900">{totalMembers}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-700">Tổng yêu cầu</p>
          <p className="text-2xl font-bold text-purple-900">{totalRequests}</p>
        </div>
      </div>

      {/* Teams Grid */}
      {teams.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={handleEditTeam}
              onManageMembers={handleManageMembers}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border">
          <p className="text-gray-600 mb-4">Chưa có team nào</p>
          <Button onClick={handleCreateTeam}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo team đầu tiên
          </Button>
        </div>
      )}

      {/* Team Dialog */}
      <TeamDialog
        open={teamDialogOpen}
        onOpenChange={setTeamDialogOpen}
        mode={teamDialogMode}
        team={selectedTeam}
        leaders={leaders}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Members Manager Dialog */}
      <TeamMembersManager
        open={membersDialogOpen}
        onOpenChange={setMembersDialogOpen}
        team={membersDialogTeam}
        allUsers={allUsers}
      />
    </div>
  );
}

