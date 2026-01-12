"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Eye,
  EyeOff,
  MapPin,
  BookOpen,
  Pen,
  Crown,
  Sparkles,
  Check,
  Mail,
  Lock,
  User,
  Loader2,
} from "lucide-react";

import { NIGERIAN_STATES, NIGERIA_GEO_MAP } from "../../lib/geo-data";
import { registerUser } from "../../lib/actions/auth";
import { logDevError } from "../../lib/error-utils";
import { GlassButton } from "../ui/GlassButton";
import { GlassCard } from "../ui/GlassCard";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Toast } from "../features/Toast";
import { PasswordFeedback } from "../ui/PasswordFeedback";
import { GoogleIcon } from "../ui/GoogleIcon";
import { cn } from "../../lib/utils";

export type RegistrationRole = "reader" | "blogger";

export type RegistrationFormValues = {
  role: RegistrationRole;
  name?: string;
  email: string;
  password: string;
  state?: string;
  lga?: string;
};

export type RegistrationFormProps = {
  className?: string;
  callbackUrl?: string;
};

function normalizeCallbackUrl(raw?: string): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;

  const lower = raw.toLowerCase();
  if (lower.startsWith("/login")) return null;
  if (lower.startsWith("/register")) return null;
  if (lower.startsWith("/api/auth")) return null;

  return raw;
}

export function RegistrationForm({
  className,
  callbackUrl,
}: RegistrationFormProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<0 | 1 | 2>(0);
  const [role, setRole] = React.useState<RegistrationRole>("reader");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [state, setState] = React.useState<string>("");
  const [lga, setLga] = React.useState<string>("");
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<{
    open: boolean;
    message: string;
    variant?: "success" | "error";
  }>({ open: false, message: "" });
  const [googleBusy, setGoogleBusy] = React.useState(false);

  // Auto-focus name field on step 1
  const nameRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (step === 1) {
      nameRef.current?.focus();
    }
  }, [step]);

  // Email validation
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const safeCallbackUrl = normalizeCallbackUrl(callbackUrl);

  const lgas = state ? NIGERIA_GEO_MAP.get(state) ?? [] : [];
  const lgaDisabled = !state || lgas.length === 0;

  const defaultAfterAuth = role === "blogger" ? "/bloggers/editor" : "/profile";
  const callbackAllowedByRole =
    safeCallbackUrl &&
    safeCallbackUrl.startsWith("/blogger") &&
    role !== "blogger"
      ? null
      : safeCallbackUrl;
  const afterAuth = callbackAllowedByRole ?? defaultAfterAuth;

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      const values: RegistrationFormValues = {
        role,
        name: name || undefined,
        email,
        password,
        state: state || undefined,
        lga: lga || undefined,
      };

      const created = await registerUser(values);
      if (!created.ok) {
        setToast({ open: true, message: created.error, variant: "error" });
        return;
      }

      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (!res || res.error) {
        setToast({
          open: true,
          message: "Account created. Please log in.",
          variant: "success",
        });
        const loginHref = callbackAllowedByRole
          ? `/login?callbackUrl=${encodeURIComponent(callbackAllowedByRole)}`
          : "/login";
        router.replace(loginHref);
        return;
      }

      // 👑 Redirect to onboarding for interest selection
      router.replace("/onboarding");
    } catch (error) {
      logDevError("RegistrationForm.submit", error);
      setToast({
        open: true,
        message: "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <GlassCard className={"p-6 md:p-10 " + (className ?? "")}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-foreground/50">Registration</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-black tracking-tight">
              Create your account
            </h2>
          </div>
          <div className="text-xs font-mono text-foreground/50">
            Step {step + 1}/3
          </div>
        </div>

        <div className="mt-8">
          {step === 0 ? (
            <div className="space-y-6">
              <p className="text-sm text-foreground/60 text-center">
                Choose your path in the Kingdom
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Reader Card */}
                <button
                  type="button"
                  onClick={() => setRole("reader")}
                  disabled={busy}
                  className={cn(
                    "group relative glass-card p-6 text-left transition-all duration-300",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    role === "reader"
                      ? "border-king-orange ring-2 ring-king-orange/30 bg-gradient-to-br from-king-orange/10 to-transparent"
                      : "hover:border-foreground/20"
                  )}
                >
                  {/* Selected Badge */}
                  {role === "reader" && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-king-orange flex items-center justify-center animate-in zoom-in duration-200">
                      <Check className="w-4 h-4 text-black" />
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
                      role === "reader"
                        ? "bg-king-orange/20"
                        : "bg-foreground/5 group-hover:bg-foreground/10"
                    )}
                  >
                    <BookOpen
                      className={cn(
                        "w-6 h-6 transition-colors",
                        role === "reader"
                          ? "text-king-orange"
                          : "text-foreground/60"
                      )}
                    />
                  </div>

                  {/* Title */}
                  <div
                    className={cn(
                      "text-lg font-black transition-colors",
                      role === "reader" && "text-king-orange"
                    )}
                  >
                    Reader
                  </div>

                  {/* Description */}
                  <p className="mt-2 text-sm text-foreground/60">
                    Explore the kingdom&apos;s finest content
                  </p>

                  {/* Features */}
                  <ul className="mt-4 space-y-2">
                    {[
                      "Personalized For You feed",
                      "Save & bookmark articles",
                      "Follow your favorite creators",
                      "React & comment on posts",
                    ].map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-xs text-foreground/50"
                      >
                        <Sparkles className="w-3 h-3 text-king-gold" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>

                {/* Blogger Card */}
                <button
                  type="button"
                  onClick={() => setRole("blogger")}
                  disabled={busy}
                  className={cn(
                    "group relative glass-card p-6 text-left transition-all duration-300",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    role === "blogger"
                      ? "border-king-gold ring-2 ring-king-gold/30 bg-gradient-to-br from-king-gold/10 to-transparent"
                      : "hover:border-foreground/20"
                  )}
                >
                  {/* Selected Badge */}
                  {role === "blogger" && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-king-gold flex items-center justify-center animate-in zoom-in duration-200">
                      <Check className="w-4 h-4 text-black" />
                    </div>
                  )}

                  {/* Crown Badge */}
                  <div className="absolute top-3 right-3">
                    <Crown
                      className={cn(
                        "w-4 h-4 transition-colors",
                        role === "blogger"
                          ? "text-king-gold"
                          : "text-foreground/20"
                      )}
                    />
                  </div>

                  {/* Icon */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
                      role === "blogger"
                        ? "bg-king-gold/20"
                        : "bg-foreground/5 group-hover:bg-foreground/10"
                    )}
                  >
                    <Pen
                      className={cn(
                        "w-6 h-6 transition-colors",
                        role === "blogger"
                          ? "text-king-gold"
                          : "text-foreground/60"
                      )}
                    />
                  </div>

                  {/* Title */}
                  <div
                    className={cn(
                      "text-lg font-black transition-colors",
                      role === "blogger" && "text-king-gold"
                    )}
                  >
                    Blogger
                  </div>

                  {/* Description */}
                  <p className="mt-2 text-sm text-foreground/60">
                    Become a content sovereign
                  </p>

                  {/* Features */}
                  <ul className="mt-4 space-y-2">
                    {[
                      "All Reader features included",
                      "Rich WYSIWYG blog editor",
                      "Analytics dashboard",
                      "Build your audience",
                    ].map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-xs text-foreground/50"
                      >
                        <Sparkles className="w-3 h-3 text-king-gold" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-foreground/50 flex items-center gap-2">
                  <User className="w-3 h-3" />
                  Name
                </label>
                <div className="mt-2">
                  <Input
                    ref={nameRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    placeholder="Your name"
                    autoComplete="name"
                    disabled={busy}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-foreground/50 flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  Email
                </label>
                <div className="mt-2">
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={busy}
                    className={cn(
                      email &&
                        !isValidEmail &&
                        "border-red-500/50 focus:border-red-500"
                    )}
                  />
                </div>
                {email && !isValidEmail && (
                  <p className="mt-1 text-[10px] text-red-500">
                    Enter a valid email
                  </p>
                )}
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
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
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
                <div className="mt-3">
                  <PasswordFeedback password={password} />
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-foreground/60 mb-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Your Location (Nigeria)
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-mono text-foreground/50">
                    State
                  </label>
                  <div className="mt-2">
                    <Select
                      value={state}
                      onChange={(e) => {
                        setState(e.target.value);
                        setLga("");
                      }}
                    >
                      <option value="">Select a state</option>
                      {NIGERIAN_STATES.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-mono text-foreground/50">
                    LGA
                  </label>
                  <div className="mt-2">
                    <Select
                      value={lga}
                      onChange={(e) => setLga(e.target.value)}
                      disabled={lgaDisabled}
                    >
                      <option value="">
                        {!state
                          ? "Select state first"
                          : lgas.length === 0
                          ? "Coming soon"
                          : "Select an LGA"}
                      </option>
                      {lgas.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
              {state && (
                <div className="text-xs text-foreground/50 bg-foreground/5 rounded-lg px-3 py-2 border border-foreground/10">
                  📍 {state}
                  {lga ? `, ${lga}` : ""} — Nigeria
                </div>
              )}
            </div>
          ) : null}

          <div className="mt-10 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <GlassButton
                variant="ghost"
                onClick={() =>
                  setStep((s) => (s === 0 ? 0 : ((s - 1) as 0 | 1 | 2)))
                }
                disabled={step === 0 || busy}
              >
                Back
              </GlassButton>

              {step < 2 ? (
                <GlassButton
                  variant="primary"
                  onClick={() => setStep((s) => (s + 1) as 0 | 1 | 2)}
                  disabled={
                    busy ||
                    (step === 1 &&
                      (!name.trim() || !isValidEmail || password.length < 8))
                  }
                >
                  Continue
                </GlassButton>
              ) : (
                <GlassButton
                  variant="primary"
                  onClick={submit}
                  disabled={!isValidEmail || password.length < 8 || busy}
                >
                  {busy ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating…
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </GlassButton>
              )}
            </div>

            {step === 0 && (
              <>
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-foreground/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-foreground/50">
                      Or
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGoogleBusy(true);
                    void signIn("google", { callbackUrl: afterAuth });
                  }}
                  disabled={googleBusy || busy}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full border border-foreground/10 bg-foreground/5 text-foreground font-medium transition-all duration-300 active:scale-[0.98]",
                    googleBusy || busy
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-foreground/10"
                  )}
                >
                  {googleBusy ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>
                    {googleBusy ? "Connecting…" : "Continue with Google"}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </GlassCard>

      <Toast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast({ open: false, message: "" })}
      />
    </>
  );
}
