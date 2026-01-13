"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function DashboardDirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto login and redirect to dashboard
    const autoLogin = async () => {
      try {
        // Try to login automatically
        const result = await signIn("credentials", {
          email: "TechBC@gmail.com",
          password: "123456",
          redirect: false,
        });

        if (result?.ok) {
          router.push("/dashboard");
        } else {
          // If login fails, redirect to login page
          router.push("/login");
        }
      } catch (error) {
        console.error("Auto login error:", error);
        router.push("/login");
      }
    };

    autoLogin();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Đang đăng nhập tự động...</p>
        <p className="text-sm text-gray-500 mt-2">Vui lòng đợi...</p>
      </div>
    </div>
  );
}

