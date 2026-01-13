"use client";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";

export default function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      // Clear cookies manually first
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        if (
          name.includes("authjs") ||
          name.includes("next-auth") ||
          name.includes("csrf")
        ) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });

      // Sign out
      await signOut({ 
        redirect: false,
        callbackUrl: "/login"
      });

      // Force redirect with full page reload
      setTimeout(() => {
        window.location.href = "/login";
      }, 200);
    } catch (error) {
      console.error("Sign out error:", error);
      // Redirect anyway
      window.location.href = "/login";
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      variant="outline"
      size="sm"
      disabled={isLoading}
      className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all duration-200"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Đang đăng xuất...</span>
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4" />
          <span>Đăng xuất</span>
        </>
      )}
    </Button>
  );
}
