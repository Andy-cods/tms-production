"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  CheckCircle, 
  User, 
  Clock, 
  Tag, 
  Calendar, 
  UserPlus, 
  Eye, 
  Star,
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignDialog } from "./assign-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface PendingRequest {
  id: string;
  title: string;
  description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  requesterType: "INTERNAL" | "CUSTOMER";
  createdAt: string;
  deadline: string;
  creator: {
    name: string;
    email: string;
  };
  category: {
    name: string;
  };
}

interface InboxTabProps {
  requests?: PendingRequest[];
  isLoading?: boolean;
  onAssign?: (requestId: string) => void;
  teamMembers?: Array<{ id: string; name: string | null; email: string | null }>;
}

export function InboxTab({ requests = [], isLoading = false, onAssign, teamMembers = [] }: InboxTabProps) {
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<{ id: string; title: string } | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [localTeamMembers, setLocalTeamMembers] = useState(teamMembers);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "destructive";
      case "HIGH":
        return "default";
      case "MEDIUM":
        return "secondary";
      case "LOW":
        return "outline";
      default:
        return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-700 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "LOW":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleAssign = async (requestId: string, requestTitle: string) => {
    console.log('🎯 handleAssign called:', requestId);
    if (onAssign) {
      console.log('📞 Calling onAssign prop');
      onAssign(requestId);
    } else {
      console.log('📝 Open assignment dialog');
      
      // Set selected request first
      setSelectedRequest({ id: requestId, title: requestTitle });
      setShowAssignDialog(true);
      
      // Load team members if not already loaded
      if (localTeamMembers.length === 0) {
        setLoadingMembers(true);
        try {
          console.log('📡 Fetching team members...');
          const response = await fetch('/api/teams/members');
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const data = await response.json();
          console.log('✅ Team members loaded:', data.members?.length || 0);
          
          setLocalTeamMembers(data.members || []);
        } catch (error) {
          console.error('❌ Failed to load team members:', error);
          alert('Không thể tải danh sách thành viên. Vui lòng thử lại.');
          setShowAssignDialog(false);
        } finally {
          setLoadingMembers(false);
        }
      }
    }
  };

  if (isLoading) {
    return <SkeletonCards count={3} />;
  }

  if (!requests?.length) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Tuyệt vời! Không có yêu cầu chờ xử lý
        </h3>
        <p className="text-gray-600">
          Tất cả yêu cầu đã được phân công
        </p>
      </div>
    );
  }

  return (
    <>
    <div className="p-6 space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-primary/50 hover:shadow-lg transition-all duration-200 group"
        >
          <div className="flex items-start justify-between gap-6">
            {/* Left: Request Info */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 cursor-pointer transition-colors">
                  {request.title}
                </h3>
                <Badge 
                  variant={getPriorityVariant(request.priority)}
                  className={getPriorityColor(request.priority)}
                >
                  {request.priority}
                </Badge>
                {request.requesterType === "CUSTOMER" && (
                  <Badge 
                    variant="outline" 
                    className="border-orange-500 text-orange-700 bg-orange-50"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Khách hàng
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {request.creator.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {formatDistanceToNow(new Date(request.createdAt), { 
                    locale: vi, 
                    addSuffix: true 
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  {request.category.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Hạn: {format(new Date(request.deadline), "dd/MM/yyyy HH:mm")}
                </span>
              </div>

              {request.description && (
                <p className="text-sm text-gray-700 line-clamp-2 bg-gray-50 p-3 rounded-lg">
                  {request.description}
                </p>
              )}

              {/* SLA Warning */}
              {new Date(request.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000) && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Sắp đến hạn!</span>
                </div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex flex-col gap-2 min-w-[140px]">
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔵 Phân công button clicked for:', request.id);
                  console.log('Button clicked, calling handleAssign');
                  handleAssign(request.id, request.title);
                }}
                type="button"
                className="relative z-[60] w-full cursor-pointer group-hover:shadow-md transition-all"
                style={{ pointerEvents: 'auto' }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Phân công
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Chi tiết clicked for:', request.id);
                  router.push(`/requests/${request.id}`);
                }}
                type="button"
                className="relative z-[60] w-full cursor-pointer hover:bg-primary-50 hover:border-primary-300 transition-all"
                style={{ pointerEvents: 'auto' }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Chi tiết
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
    {selectedRequest && (
      <AssignDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        requestId={selectedRequest.id}
        requestTitle={selectedRequest.title}
        teamMembers={localTeamMembers || teamMembers || []}
        loadingMembers={loadingMembers}
      />
    )}
    </>
  );
}

function SkeletonCards({ count }: { count: number }) {
  return (
    <div className="p-6 space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
            <div className="flex flex-col gap-2 min-w-[140px]">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
