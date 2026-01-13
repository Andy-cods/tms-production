// app/layout.tsx
import "./globals.css";
import { Providers } from "@/app/providers";
import { init as initScheduler } from "@/lib/init/scheduler";
import Script from "next/script";
import AuthHeader from "@/components/layout/auth-header";

// Initialize scheduler on server start (runs once)
initScheduler().catch((error) => {
  console.error("Failed to initialize scheduler:", error);
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                if (!theme) {
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  theme = prefersDark ? 'dark' : 'light';
                }
                document.documentElement.classList.toggle('dark', theme === 'dark');
              } catch (e) {}
            })();
          `}
        </Script>
      </head>
      <body>
        <Providers>
          {/* Header - chỉ hiển thị khi đã đăng nhập và không phải trang auth */}
          <AuthHeader />

          {/* Nội dung trang */}
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
