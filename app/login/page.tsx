"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, Loader2, Building2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [csrfLoading, setCsrfLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // Fetch CSRF token on mount
  useEffect(() => {
    const fetchCsrf = async () => {
      try {
        setCsrfLoading(true);
        setError("");
        
        // Validate window.location.origin before using it
        let origin: string;
        try {
          origin = window.location.origin;
          // Validate it's a valid URL
          new URL(origin);
        } catch {
          // Fallback to relative path if origin is invalid
          origin = "";
        }
        
        const csrfUrl = origin ? `${origin}/api/auth/csrf` : "/api/auth/csrf";
        
        const response = await fetch(csrfUrl, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch CSRF token`);
        }
        
        const data = await response.json();
        if (data?.csrfToken && typeof data.csrfToken === "string") {
          setCsrfToken(data.csrfToken);
        } else {
          throw new Error("No CSRF token in response");
        }
      } catch (err: any) {
        console.error("CSRF fetch error:", err);
        const errorMessage = err?.message || "Không thể tải token bảo mật";
        // Don't show URL construction errors to user
        if (errorMessage.includes("URL") || errorMessage.includes("Invalid")) {
          setError("Lỗi kết nối. Vui lòng refresh trang và thử lại.");
        } else {
          setError("Không thể tải token bảo mật. Vui lòng refresh trang.");
        }
      } finally {
        setCsrfLoading(false);
      }
    };
    
    fetchCsrf();
  }, []);

  // Get callback URL and sanitize it
  const getSafeCallbackUrl = () => {
    const rawCallbackUrl = searchParams.get("callbackUrl");
    if (!rawCallbackUrl) return "/dashboard";
    
    try {
      // If it's an absolute URL, extract the pathname
      if (rawCallbackUrl.startsWith("http://") || rawCallbackUrl.startsWith("https://")) {
        const url = new URL(rawCallbackUrl);
        return url.pathname || "/dashboard";
      }
      
      // If it's a relative path, validate it
      if (rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//")) {
        // Remove query params and hash
        const cleanPath = rawCallbackUrl.split("?")[0].split("#")[0];
        // Ensure it's a valid path
        if (cleanPath && cleanPath.length > 0) {
          return cleanPath;
        }
      }
    } catch (err) {
      console.error("Invalid callbackUrl:", rawCallbackUrl, err);
    }
    
    return "/dashboard";
  };
  
  const safeCallbackUrl = getSafeCallbackUrl();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    
    if (!csrfToken) {
      setError("Token bảo mật chưa sẵn sàng. Vui lòng đợi và thử lại.");
      return;
    }

    setLoading(true);

    try {
      // Call NextAuth signin API directly to avoid URL construction issues
      if (!csrfToken) {
        setError("Token bảo mật không hợp lệ. Vui lòng refresh trang.");
        setLoading(false);
        return;
      }

      // Use relative URL to avoid any URL construction issues
      const signInResponse = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: formData.email.trim(),
          password: formData.password,
          csrfToken: csrfToken,
          callbackUrl: safeCallbackUrl,
          json: "true",
        }),
        credentials: "include",
      });

      const signInData = await signInResponse.json().catch(() => ({}));

      // Check if login was successful
      if (signInData?.error) {
        if (signInData.error.includes("CSRF") || signInData.error.includes("csrf")) {
          setError("Lỗi bảo mật. Đang tải lại token...");
          // Retry fetching CSRF token
          try {
            let origin: string;
            try {
              origin = window.location.origin;
              new URL(origin);
            } catch {
              origin = "";
            }
            const csrfUrl = origin ? `${origin}/api/auth/csrf` : "/api/auth/csrf";
            const response = await fetch(csrfUrl, {
              credentials: "include",
              cache: "no-store",
              headers: {
                "Content-Type": "application/json",
              },
            });
            const data = await response.json();
            if (data?.csrfToken && typeof data.csrfToken === "string") {
              setCsrfToken(data.csrfToken);
              setError("Vui lòng thử đăng nhập lại.");
            } else {
              setError("Lỗi bảo mật. Vui lòng refresh trang và thử lại.");
            }
          } catch (retryErr) {
            console.error("CSRF retry error:", retryErr);
            setError("Lỗi bảo mật. Vui lòng refresh trang và thử lại.");
          }
        } else {
          setError("Email hoặc mật khẩu không đúng");
        }
        setLoading(false);
        return;
      }

      // Success - redirect
      if (signInResponse.ok || signInData?.url) {
        setError("");
        setTimeout(() => {
          window.location.href = safeCallbackUrl;
        }, 100);
        return;
      }

      // If we reach here, login failed but no error was returned
      setError("Đăng nhập thất bại. Vui lòng thử lại.");
      setLoading(false);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            TMS
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Task Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Đăng nhập
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Nhập thông tin đăng nhập của bạn
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* CSRF Loading */}
          {csrfLoading && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tải token bảo mật...
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@company.com"
                  required
                  disabled={loading || csrfLoading}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Mật khẩu
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  disabled={loading || csrfLoading}
                  className="pl-10 pr-10 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || csrfLoading || !csrfToken}
              className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Gặp vấn đề? Liên hệ hỗ trợ</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
