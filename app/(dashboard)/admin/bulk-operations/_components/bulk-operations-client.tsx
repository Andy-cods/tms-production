"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckSquare, 
  FileText, 
  ListChecks, 
  Users,
  AlertCircle,
} from "lucide-react";

interface Props {
  userRole: string;
}

export function BulkOperationsClient({ userRole }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk Operations</h1>
        <p className="text-gray-600 mt-1">Thao tác hàng loạt trên yêu cầu và công việc</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 mb-1">
              Hướng dẫn sử dụng Bulk Operations
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Chọn tab tương ứng (Requests, Tasks, hoặc Users)</li>
              <li>• Sử dụng bộ lọc để tìm các mục cần thao tác</li>
              <li>• Chọn các mục bằng checkbox</li>
              <li>• Chọn hành động cần thực hiện từ thanh công cụ</li>
              <li>• Xác nhận và chờ hệ thống xử lý</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Requests</CardTitle>
                <CardDescription>Quản lý yêu cầu hàng loạt</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Thay đổi trạng thái, độ ưu tiên, phân công team, lưu trữ hoặc xóa nhiều yêu cầu cùng lúc.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ListChecks className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Tasks</CardTitle>
                <CardDescription>Quản lý công việc hàng loạt</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Cập nhật trạng thái, phân công người xử lý, hoặc xuất dữ liệu nhiều task cùng lúc.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Users</CardTitle>
                <CardDescription>Quản lý người dùng hàng loạt</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Kích hoạt/vô hiệu hóa, chuyển team, hoặc xuất danh sách người dùng.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Notice */}
      <Card>
        <CardHeader>
          <CardTitle>🚧 Đang phát triển</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Tính năng Bulk Operations đang được hoàn thiện. Các tính năng sẽ sớm có mặt:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-500" />
              <span>Bulk update request status/priority</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-500" />
              <span>Bulk assign requests to teams</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-500" />
              <span>Bulk archive/delete requests</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-500" />
              <span>Bulk update task status/assignee</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-500" />
              <span>Bulk export to CSV/Excel</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">Scheduled bulk operations (coming soon)</span>
            </li>
          </ul>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              💡 <strong>Tip:</strong> Server actions đã sẵn sàng tại{" "}
              <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                actions/admin/bulk-operations.ts
              </code>
              . UI components sẽ được tích hợp trong bản cập nhật tiếp theo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

