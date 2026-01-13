import { LoginForm } from "./_components/LoginForm";
import { BCAgencySplash } from "./_components/BCAgencySplash";
import { 
  Building2, 
  Sparkles, 
  Zap, 
  BarChart3, 
  TrendingUp, 
  Bell, 
  FileText,
  ClipboardList,
  CheckCircle2,
  Users
} from "lucide-react";

export default function LoginPage() {
  // Use default green theme instead of seasonal
  return (
    <>
      <BCAgencySplash />
      <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary-400/30 rounded-full animate-pulse" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-orange-400/20 rounded-full animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-primary-300/40 rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '3.5s' }} />
        <div className="absolute top-2/3 right-1/3 w-2.5 h-2.5 bg-orange-300/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '4.5s' }} />
      </div>

      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 relative overflow-hidden">
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)] animate-gradient-shift" />
        
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/60 via-transparent to-primary-400/60" />
        
        {/* Decorative circles with enhanced animation */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/15 rounded-full blur-3xl animate-float opacity-60" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/12 rounded-full blur-3xl animate-float opacity-50" style={{ animationDuration: '10s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/8 rounded-full blur-3xl animate-float opacity-40" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-br-full" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-white/10 to-transparent rounded-tl-full" />
        
        <div className="relative z-10 flex flex-col justify-center px-20 py-16 text-white">
          {/* Logo & Brand */}
          <div className="mb-16 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8 group">
              <div className="relative">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-white/20">
                  <Building2 className="w-9 h-9 text-primary-600" />
                </div>
                <div className="absolute -inset-1 bg-white/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent tracking-tight">
                  TMS
                </h1>
                <p className="text-sm text-white/80 font-medium mt-1">Task Management System</p>
              </div>
            </div>
            
            <h2 className="text-5xl font-extrabold mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Quản lý công việc
              <br />
              <span className="relative inline-block">
                <span className="text-orange-300 inline-block animate-pulse-slow">hiệu quả hơn</span>
                <span className="absolute -bottom-2 left-0 right-0 h-1 bg-orange-300/30 rounded-full blur-sm" />
              </span>
            </h2>
            
            <p className="text-xl text-white/95 mb-10 leading-relaxed animate-fade-in-up font-light" style={{ animationDelay: '0.2s' }}>
              Hệ thống quản lý yêu cầu và nhiệm vụ tập trung,
              <br />
              <span className="text-white/80">minh bạch và chuyên nghiệp.</span>
            </p>
          </div>

          {/* Features - Enhanced Design */}
          <div className="space-y-5 mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {[
              { icon: Zap, text: "Phân công tự động với load balancing" },
              { icon: BarChart3, text: "Theo dõi SLA real-time" },
              { icon: TrendingUp, text: "Dashboard & analytics mạnh mẽ" },
              { icon: Bell, text: "Thông báo đa kênh (Email, Telegram)" },
              { icon: FileText, text: "Báo cáo xuất Excel/CSV/PDF" }
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={index} 
                  className="flex items-center gap-4 group p-3 rounded-xl hover:bg-white/10 transition-all duration-300 hover:translate-x-3 hover:shadow-lg hover:shadow-white/10"
                  style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300 backdrop-blur-sm">
                    <IconComponent className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-white/95 group-hover:text-white text-lg font-medium transition-colors duration-300">{feature.text}</span>
                </div>
              );
            })}
          </div>

          {/* Stats - Enhanced Design */}
          <div className="grid grid-cols-3 gap-8 pt-12 border-t border-white/30 animate-fade-in-up backdrop-blur-sm" style={{ animationDelay: '0.8s' }}>
            {[
              { value: "500+", label: "Tasks/tháng", icon: ClipboardList },
              { value: "95%", label: "SLA tuân thủ", icon: CheckCircle2 },
              { value: "50+", label: "Người dùng", icon: Users }
            ].map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center group p-4 rounded-xl hover:bg-white/10 transition-all duration-300">
                  <div className="flex justify-center mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300 backdrop-blur-sm">
                      <IconComponent className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="text-4xl font-extrabold mb-2 bg-gradient-to-br from-white via-white to-white/80 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 inline-block">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/80 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 group">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">TMS</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Task Management System</p>
          </div>

          {/* Login Card */}
          <div className="bg-white dark:bg-card rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-border animate-fade-in-up hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-500 relative overflow-hidden group">
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-bl-full -mr-16 -mt-16" />
            <div className="mb-8 relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary-500 animate-pulse" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Chào mừng trở lại
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Đăng nhập để tiếp tục quản lý công việc
              </p>
            </div>

            <LoginForm />

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-border text-center text-sm text-gray-500 dark:text-gray-400 relative z-10">
              <p>
                Gặp vấn đề đăng nhập?{" "}
                <a href="mailto:support@tms.com" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors">
                  Liên hệ hỗ trợ
                </a>
              </p>
            </div>
          </div>

          {/* Bottom Note */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            © 2025 TMS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
