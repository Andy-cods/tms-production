"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface MatchingUsersPreviewProps {
  preferredPositions: string[];
  requireExactMatch: boolean;
}

export function MatchingUsersPreview({
  preferredPositions,
  requireExactMatch,
}: MatchingUsersPreviewProps) {
  const [matchingUsers, setMatchingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preferredPositions.length > 0) {
      // Placeholder: In real implementation, this would call a server action
      // to fetch matching users based on preferredPositions
      setLoading(false);
      // const result = await getMatchingUsers({ preferredPositions, requireExactMatch });
      // For now, just show empty state
      setMatchingUsers([]);
    } else {
      setMatchingUsers([]);
    }
  }, [preferredPositions, requireExactMatch]);

  if (preferredPositions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Matching Users Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-500">Đang tải...</p>
        ) : matchingUsers.length > 0 ? (
          <div className="space-y-2">
            {matchingUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium">{user.name}</span>
                <Badge variant="outline" className="text-xs">
                  {user.position}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Sẽ hiển thị danh sách users khớp với positions đã chọn khi có dữ liệu
          </p>
        )}
        {requireExactMatch && (
          <p className="text-xs text-blue-600 mt-2">
            ⚠️ Exact match: Chỉ hiển thị users có position khớp chính xác
          </p>
        )}
      </CardContent>
    </Card>
  );
}

