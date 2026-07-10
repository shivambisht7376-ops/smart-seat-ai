"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

// ─── Zod schema ───────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── Demo credentials ─────────────────────────────────────────────────────────
const DEMO_CREDS = [
  { role: "Super Admin", email: "admin@smartseat.ai", password: "Admin@123", color: "text-purple-400" },
  { role: "HR Admin", email: "hr@smartseat.ai", password: "Hr@123456", color: "text-blue-400" },
  { role: "Project Manager", email: "pm@smartseat.ai", password: "Pm@123456", color: "text-emerald-400" },
  { role: "Employee", email: "employee@smartseat.ai", password: "Emp@123456", color: "text-slate-400" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      toast.success("Welcome back! Redirecting to dashboard…");
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { detail?: string })?.detail || "Invalid credentials. Please try again.";
      toast.error(message);
    }
  };

  const fillDemo = (email: string, password: string) => {
    setValue("email", email);
    setValue("password", password);
  };

  return (
    <div className="w-full max-w-md space-y-6 animate-fade-in">
      {/* Mobile logo */}
      <div className="flex lg:hidden items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-lg shadow-primary/30">
          <span className="text-white font-bold">S</span>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">SmartSeat AI</span>
      </div>

      {/* Main card */}
      <Card className="glass-card border-border/60 shadow-2xl shadow-black/30">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-xl">Sign In</CardTitle>
          </div>
          <CardDescription>
            Enter your credentials to access the platform
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="login-form">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                autoFocus
                {...register("email")}
                className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register("password")}
                  className={cn(
                    "pr-10",
                    errors.password && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              id="submit-login"
              variant="brand"
              size="lg"
              className="w-full mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">Demo Accounts</span>
            </div>
          </div>

          {/* Demo credentials */}
          <div className="grid grid-cols-2 gap-2">
            {DEMO_CREDS.map((cred) => (
              <button
                key={cred.role}
                type="button"
                id={`demo-${cred.role.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => fillDemo(cred.email, cred.password)}
                className={cn(
                  "text-left p-2.5 rounded-lg border border-border/60 hover:border-border",
                  "bg-muted/30 hover:bg-muted/60 transition-all duration-150",
                  "group"
                )}
              >
                <div className={cn("text-xs font-semibold", cred.color)}>{cred.role}</div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">{cred.email}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-slate-600">
        Protected by JWT authentication & RBAC
      </p>
    </div>
  );
}
