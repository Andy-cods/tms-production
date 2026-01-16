"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function SignOutPage() {
  const [status, setStatus] = useState("Đang đăng xuất...");

  useEffect(() => {
    const performSignOut = async () => {
      try {
        setStatus("Đang xóa cookies...");
        
        // Clear all cookies manually
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          
          // Clear all auth-related cookies
          if (
            name.includes("authjs") ||
            name.includes("next-auth") ||
            name.includes("csrf") ||
            name.includes("session")
          ) {
            // Clear with different path and domain combinations
            const hostname = window.location.hostname;
            const paths = ["/", ""];
            const domains = [hostname, `.${hostname}`, ""];
            
            for (const path of paths) {
              for (const domain of domains) {
                if (domain) {
                  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain}`;
                } else {
                  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
                }
              }
            }
          }
        }

        setStatus("Đang đăng xuất khỏi hệ thống...");
        
        // Sign out with NextAuth
        await signOut({ 
          redirect: false,
          callbackUrl: "/login"
        });

        setStatus("Hoàn tất. Đang chuyển hướng...");
        
        // Force redirect with full page reload
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
      } catch (error) {
        console.error("Sign out error:", error);
        setStatus("Đã xảy ra lỗi. Đang chuyển hướng...");
        // Redirect anyway
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      }
    };

    performSignOut();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {status}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Vui lòng đợi...
        </p>
      </div>
    </div>
  );
}

