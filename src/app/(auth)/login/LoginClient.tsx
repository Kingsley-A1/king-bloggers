"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { signIn } from "next-auth/react";

import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { GlassButton } from "@/components/ui/GlassButton";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/features/Toast";
import { Logo } from "@/components/ui/Logo";
import { PasswordFeedback } from "@/components/ui/PasswordFeedback";

export default function LoginClient() {
  const router = useRouter();
  const search = useSearchParams();

  const rawCallbackUrl = search.get("callbackUrl");
  const callbackUrl = rawCallbackUrl && rawCallbackUrl.startsWith("/") ? rawCallbackUrl : "/";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<{
    open: boolean;
    message: string;
    variant?: "success" | "error";
  }>({ open: false, message: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setToast({ open: true, message: "Invalid email or password.", variant: "error" });
        return;
      }

      router.replace(callbackUrl);
    } finally {
      setBusy(false);
    }
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
              Enter your credentials to access your account
            </p>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <div>
              <label className="text-xs font-mono text-foreground/50">Email</label>
              <div className="mt-2">
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-foreground/50">Password</label>
              <div className="mt-2">
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Your password"
                />
              </div>
              <div className="mt-3">
                <PasswordFeedback password={password} />
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <GlassButton variant="primary" type="submit" disabled={!email || password.length < 8 || busy}>
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size={16} /> Signing in…
                  </span>
                ) : (
                  "Sign In"
                )}
              </GlassButton>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-foreground/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-foreground/50">Or continue with</span>
                </div>
              </div>

              <GlassButton variant="glass" type="button" onClick={() => void signIn("google", { callbackUrl })}>
                Google
              </GlassButton>
            </div>
          </form>
        </GlassCard>

        <div className="text-center text-sm text-foreground/60">
          No account?{" "}
          <Link className="font-medium text-king-orange hover:underline" href="/register">
            Create one
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
