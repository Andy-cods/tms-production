"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, Building2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SignOutPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const router = useRouter();

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      console.error("Sign out error:", error);
      setIsLoading(false);
    }
  };

  // Show countdown hint (but don't auto signout)
  useEffect(() => {
    if (isLoading) return;
    
    const timer = setTimeout(() => {
      setCountdown(5);
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [isLoading]);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-12 animate-on-load">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">TMS</h1>
                <p className="text-sm text-white/80">Task Management System</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold mb-4">
              Cảm ơn bạn đã<br />
              <span className="text-orange-300">sử dụng TMS</span>
            </h2>
            
            <p className="text-lg text-white/90">
              Hẹn gặp lại bạn lần sau!
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Signout Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-card rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-border">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <LogOut className="w-10 h-10 text-red-500 dark:text-red-400" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
              Đăng xuất
            </h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
            </p>

            {/* Info */}
            {countdown !== null && countdown > 0 && (
              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-center text-blue-700 dark:text-blue-300">
                  Vui lòng xác nhận đăng xuất để bảo mật tài khoản của bạn
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full h-12 text-base font-medium bg-red-500 hover:bg-red-600 text-white"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang đăng xuất...
                  </>
                ) : (
                  <>
                    <LogOut className="w-5 h-5 mr-2" />
                    Đăng xuất
                  </>
                )}
              </Button>

              <Button
                onClick={() => router.back()}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 text-base"
                size="lg"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Quay lại
              </Button>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-border">
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Bạn có thể đăng nhập lại bất cứ lúc nào
              </p>
            </div>
          </div>

          {/* Back to home link */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              ← Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

