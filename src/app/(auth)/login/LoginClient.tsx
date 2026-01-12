"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";

import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { GlassButton } from "@/components/ui/GlassButton";
import { Toast } from "@/components/features/Toast";
import { Logo } from "@/components/ui/Logo";
import { PasswordFeedback } from "@/components/ui/PasswordFeedback";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { cn } from "@/lib/utils";

export default function LoginClient() {
  const router = useRouter();
  const search = useSearchParams();

  const rawCallbackUrl = search.get("callbackUrl");
  const callbackUrl =
    rawCallbackUrl && rawCallbackUrl.startsWith("/") ? rawCallbackUrl : "/";

  const registerHref = `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [googleBusy, setGoogleBusy] = React.useState(false);
  const [toast, setToast] = React.useState<{
    open: boolean;
    message: string;
    variant?: "success" | "error";
  }>({ open: false, message: "" });

  // Auto-focus email on mount
  const emailRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Validate email format
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = isValidEmail && password.length >= 8 && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    
    setBusy(true);
    try {
      const res = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setToast({
          open: true,
          message: "Invalid email or password. Please try again.",
          variant: "error",
        });
        // Shake animation effect - focus password field
        return;
      }

      // Success - fast redirect
      router.replace(callbackUrl);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleBusy(true);
    await signIn("google", { callbackUrl });
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo size={48} />
          </Link>
        </div>

        <GlassCard className="p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-foreground/60 mt-2">
              Sign in to continue to King Bloggers
            </p>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <div>
              <label className="text-xs font-mono text-foreground/50 flex items-center gap-2">
                <Mail className="w-3 h-3" />
                Email
              </label>
              <div className="mt-2">
                <Input
                  ref={emailRef}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={busy}
                  className={cn(
                    email && !isValidEmail && "border-red-500/50 focus:border-red-500"
                  )}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-foreground/50 flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Password
              </label>
              <div className="mt-2 relative">
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={busy}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-2">
                <PasswordFeedback password={password} />
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <GlassButton
                variant="primary"
                type="submit"
                disabled={!canSubmit}
                className="relative"
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  "Sign In"
                )}
              </GlassButton>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-foreground/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-foreground/50">
                    or
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleBusy || busy}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full border border-foreground/10 bg-foreground/5 hover:bg-foreground/10 text-foreground font-medium transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
              >
                {googleBusy ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span>Continue with Google</span>
              </button>
            </div>
          </form>
        </GlassCard>

        <div className="text-center text-sm text-foreground/60 mt-6">
          New to King Bloggers?{" "}
          <Link
            className="font-medium text-king-orange hover:underline"
            href={registerHref}
          >
            Create account
          </Link>
        </div>
      </div>

      <Toast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast({ open: false, message: "" })}
      />
    </main>
  );
}
