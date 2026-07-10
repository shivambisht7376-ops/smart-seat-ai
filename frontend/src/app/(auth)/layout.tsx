import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to SmartSeat AI enterprise workforce management platform",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-dark flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-500/20 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-600/15 blur-[100px]" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">SmartSeat AI</span>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Intelligent Workforce<br />
              <span className="bg-gradient-brand bg-clip-text text-transparent">
                Management Platform
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
              Manage 5,000+ employees, projects, and office seats with AI-powered 
              insights and real-time analytics.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {[
              "🪑 Seat Allocation",
              "📋 Project Mapping",
              "🤖 AI Assistant",
              "📊 Analytics",
            ].map((feat) => (
              <span
                key={feat}
                className="px-3 py-1.5 rounded-full bg-white/8 border border-white/12 text-slate-300 text-sm backdrop-blur-sm"
              >
                {feat}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: "Employees", value: "5,000+" },
              { label: "Projects", value: "150+" },
              { label: "Seats", value: "10,000+" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-slate-600 text-xs">
          © 2026 SmartSeat AI. Enterprise Edition.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        {children}
      </div>
    </div>
  );
}
