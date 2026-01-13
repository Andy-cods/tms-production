"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserRoleBadge } from "@/components/ui/user-role-badge";
import { Mail, Briefcase, Users, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  position: string | null;
  team?: {
    name: string;
  } | null;
  createdAt: Date | string;
}

interface UserProfileCardProps {
  user: User;
  showDetails?: boolean;
}

export function UserProfileCard({ user, showDetails = true }: UserProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-orange-500 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {user.name?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
            
            {/* Basic Info */}
            <div>
              <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <UserRoleBadge role={user.role as any} />
                {user.position && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {user.position}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      {showDetails && (
        <CardContent>
          <div className="space-y-3">
            {/* Email */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>

            {/* Team */}
            {user.team && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>Team: {user.team.name}</span>
              </div>
            )}

            {/* Joined date */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                Tham gia{" "}
                {formatDistanceToNow(
                  new Date(user.createdAt),
                  { addSuffix: true, locale: vi }
                )}
              </span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

