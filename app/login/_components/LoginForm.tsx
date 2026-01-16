"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  // Get callbackUrl and ensure it's a valid relative path
  const rawCallbackUrl = params.get("callbackUrl");
  let callbackUrl = "/dashboard";

  if (rawCallbackUrl) {
    // Only use callbackUrl if it's a valid relative path
    if (rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//")) {
      callbackUrl = rawCallbackUrl;
    }
  }

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isIPBlocked, setIsIPBlocked] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    otp: "",
  });

  // Get client info for anomaly detection
  const getClientInfo = () => ({
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    // IP will be extracted server-side from headers
    clientIP: "client", // Placeholder - server will use actual IP from headers
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Ensure callbackUrl is always a valid relative path
      // NextAuth requires relative paths, not absolute URLs
      let safeCallbackUrl = "/dashboard";
      
      if (callbackUrl && typeof callbackUrl === "string") {
        // Only accept relative paths starting with /
        if (callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
          // Remove any query params or fragments that might cause issues
          const cleanPath = callbackUrl.split("?")[0].split("#")[0];
          // Validate it's a simple path (no special characters that could break URL construction)
          if (cleanPath && /^\/[a-zA-Z0-9\/_-]*$/.test(cleanPath)) {
            safeCallbackUrl = cleanPath;
          }
        }
      }
      
      // Store callbackUrl for use after successful login
      const finalCallbackUrl = safeCallbackUrl;
      
      const clientInfo = getClientInfo();

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        otp: formData.otp || undefined,
        clientIP: clientInfo.clientIP,
        userAgent: clientInfo.userAgent,
        redirect: false,
        // Don't pass callbackUrl to signIn to avoid URL construction issues
        // We'll handle redirect manually
      });

      if (result?.error) {
        if (result.error === "ACCOUNT_LOCKED") {
          setError("Tài khoản đang bị khóa tạm thời. Vui lòng thử lại sau.");
        } else if (result.error === "TWO_FACTOR_REQUIRED") {
          setError("Vui lòng nhập mã 2FA để đăng nhập.");
        } else if (result.error === "IP_BLOCKED") {
          setIsIPBlocked(true);
          setError("Địa chỉ IP của bạn đã bị tạm khóa do hoạt động đáng ngờ. Vui lòng thử lại sau.");
        } else {
          setError("Email hoặc mật khẩu không đúng");
        }
        setLoading(false);
        return;
      }

      if (result?.ok) {
        // Force a full page reload to ensure cookies are properly set and sent
        // This is critical when accessing from different machines
        // Use a longer delay to ensure cookie is fully set
        setTimeout(() => {
          // Use window.location.replace to avoid adding to history
          window.location.replace(finalCallbackUrl);
        }, 200);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
      {/* Error Message */}
      {error && (
        <div className={`${isIPBlocked ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'} border px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-fade-in shadow-sm`}>
          {isIPBlocked ? (
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          ) : (
            <span className="font-medium">⚠️</span>
          )}
          <span>{error}</span>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2 group">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors duration-200" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@company.com"
            required
            disabled={loading}
            className="pl-10 h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2 group">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Mật khẩu
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors duration-200" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            required
            disabled={loading}
            className="pl-10 pr-10 h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 2FA Field */}
      <div className="space-y-2 group">
        <Label htmlFor="otp" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Mã 2FA
        </Label>
        <div className="relative">
          <Input
            id="otp"
            type="text"
            value={formData.otp}
            onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
            placeholder="123456"
            disabled={loading}
            className="h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
          />
        </div>
      </div>

      {/* Remember & Forgot */}
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 focus:ring-2 transition-all duration-200 cursor-pointer"
          />
          <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">Ghi nhớ đăng nhập</span>
        </label>
        <a href="#" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-all duration-200 hover:underline">
          Quên mật khẩu?
        </a>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-lg shadow-primary-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
  );
}

