"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateRolePermission, applyPermissionPreset } from "@/actions/permissions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Shield, Lock, Loader2, Zap } from "lucide-react";
import { Role } from "@prisma/client";

interface PermissionMatrixProps {
  permissions: Array<{
    id: string;
    name: string;
    description: string | null;
    resource: string;
    action: string;
    category: string | null;
  }>;
  matrix: Record<string, Record<string, boolean>>;
}

export function PermissionMatrix({
  permissions,
  matrix: initialMatrix,
}: PermissionMatrixProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>(Role.STAFF);

  const roles = [Role.STAFF, Role.LEADER, Role.ADMIN];

  // Group permissions by category
  const grouped = permissions.reduce((acc, perm) => {
    const cat = perm.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>);

  async function handleToggle(permissionId: string, isGranted: boolean) {
    setLoading(permissionId);

    try {
      const result = await updateRolePermission(
        selectedRole,
        permissionId,
        isGranted
      );

      if (result.success) {
        toast.success(isGranted ? "Đã cấp quyền" : "Đã thu hồi quyền");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(null);
    }
  }

  async function handleApplyPreset(preset: string) {
    if (!preset) return;

    setLoading("preset");

    try {
      const result = await applyPermissionPreset(selectedRole, preset);

      if (result.success) {
        toast.success(`Đã áp dụng preset: ${preset}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(null);
    }
  }

  const currentMatrix = initialMatrix[selectedRole] || {};
  const grantedCount = Object.values(currentMatrix).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-600" />
            Permission Matrix
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage permissions for each role
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Preset dropdown */}
          <Select
            value=""
            onValueChange={handleApplyPreset}
            disabled={loading === "preset"}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Apply Preset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minimal">
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  Minimal
                </div>
              </SelectItem>
              <SelectItem value="standard">
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  Standard
                </div>
              </SelectItem>
              <SelectItem value="extended">
                <div className="flex items-center gap-2">
                  <Lock className="h-3 w-3" />
                  Extended
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Role selector */}
          <Select
            value={selectedRole}
            onValueChange={(value) => setSelectedRole(value as Role)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-500">Total Permissions</p>
          <p className="text-2xl font-bold text-gray-900">{permissions.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Granted to {selectedRole}</p>
          <p className="text-2xl font-bold text-green-600">{grantedCount}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Coverage</p>
          <p className="text-2xl font-bold text-primary-600">
            {permissions.length > 0 ? Math.round((grantedCount / permissions.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Permission categories */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, perms]) => {
          const categoryGranted = perms.filter(
            (p) => currentMatrix[p.id]
          ).length;

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{category}</span>
                  <Badge variant="secondary">
                    {categoryGranted}/{perms.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {perms.map((perm) => {
                    const isGranted = currentMatrix[perm.id] || false;
                    const isLoading = loading === perm.id;

                    return (
                      <div
                        key={perm.id}
                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Checkbox
                          checked={isGranted}
                          onCheckedChange={(checked) =>
                            handleToggle(perm.id, !!checked)
                          }
                          disabled={isLoading || selectedRole === "ADMIN"}
                          id={perm.id}
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={perm.id}
                            className="font-medium text-gray-900 cursor-pointer"
                          >
                            {perm.name}
                          </label>
                          <p className="text-sm text-gray-600 mt-1">
                            {perm.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {perm.resource}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {perm.action}
                            </Badge>
                          </div>
                        </div>
                        {isLoading && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

