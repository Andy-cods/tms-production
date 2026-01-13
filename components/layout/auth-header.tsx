"use client";

import { usePathname } from "next/navigation";

export default function AuthHeader() {
  const pathname = usePathname();

  // Không hiển thị header trên các trang auth
  const authPages = ["/login", "/register", "/signout"];
  const isAuthPage = authPages.some((page) => pathname === page || pathname.startsWith(page + "/"));

  // Ẩn header trên trang auth (các trang dashboard đã có layout riêng)
  if (isAuthPage) {
    return null;
  }

  // Header này chỉ dùng cho các trang không có layout riêng
  // Các trang dashboard đã có layout riêng với header riêng
  return null;
}

