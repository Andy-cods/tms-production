import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HelpCircle, BookOpen, MessageCircle, FileText, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function HelpPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <HelpCircle className="w-10 h-10 text-primary-600" />
          Trung tâm Trợ giúp
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Tìm kiếm câu trả lời cho các câu hỏi thường gặp và hướng dẫn sử dụng hệ thống
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              Bắt đầu nhanh
            </CardTitle>
            <CardDescription>
              Hướng dẫn cơ bản để sử dụng hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Tạo yêu cầu mới</li>
              <li>• Quản lý nhiệm vụ</li>
              <li>• Theo dõi tiến độ</li>
              <li>• Xem báo cáo</li>
            </ul>
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Tài liệu
            </CardTitle>
            <CardDescription>
              Tài liệu chi tiết về các tính năng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Tài liệu đầy đủ sẽ được cập nhật sớm.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">Quay về Dashboard</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary-600" />
              Hỗ trợ
            </CardTitle>
            <CardDescription>
              Liên hệ với đội ngũ hỗ trợ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>support@example.com</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chúng tôi sẵn sàng hỗ trợ bạn từ 8:00 - 17:00 (Thứ 2 - Thứ 6)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Câu hỏi thường gặp</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Làm thế nào để tạo yêu cầu mới?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vào menu "Yêu cầu" → Click "Tạo yêu cầu mới" → Điền thông tin và gửi.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Làm thế nào để xem nhiệm vụ của tôi?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vào "Dashboard" hoặc "Nhiệm vụ của tôi" để xem tất cả nhiệm vụ được giao.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Làm thế nào để cập nhật trạng thái nhiệm vụ?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mở nhiệm vụ → Chọn trạng thái mới từ dropdown → Lưu thay đổi.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Back to Dashboard */}
      <div className="mt-8 flex justify-center">
        <Button asChild>
          <Link href="/dashboard">Quay về Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

