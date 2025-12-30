"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { NIGERIAN_STATES, NIGERIA_GEO_MAP } from "../../lib/geo-data";
import { registerUser } from "../../lib/actions/auth";
import { logDevError } from "../../lib/error-utils";
import { GlassButton } from "../ui/GlassButton";
import { GlassCard } from "../ui/GlassCard";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Spinner } from "../ui/Spinner";
import { Toast } from "../features/Toast";
import { PasswordFeedback } from "../ui/PasswordFeedback";

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
};

export function RegistrationForm({ className }: RegistrationFormProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<0 | 1 | 2>(0);
  const [role, setRole] = React.useState<RegistrationRole>("reader");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [state, setState] = React.useState<string>("");
  const [lga, setLga] = React.useState<string>("");
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<{ open: boolean; message: string; variant?: "success" | "error" }>(
    { open: false, message: "" },
  );

  const lgas = state ? NIGERIA_GEO_MAP.get(state) ?? [] : [];
  const lgaDisabled = !state || lgas.length === 0;

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
        setToast({ open: true, message: "Account created. Please log in.", variant: "success" });
        router.replace("/login");
        return;
      }

      router.replace(values.role === "blogger" ? "/blogger/editor" : "/profile");
    } catch (error) {
      logDevError("RegistrationForm.submit", error);
      setToast({ open: true, message: "Something went wrong. Please try again.", variant: "error" });
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
            <h2 className="mt-2 text-2xl md:text-3xl font-black tracking-tight">Create your account</h2>
          </div>
          <div className="text-xs font-mono text-foreground/50">Step {step + 1}/3</div>
        </div>

        <div className="mt-8">
          {step === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setRole("reader")}
                disabled={busy}
                className={
                  "glass-card p-6 text-left active:scale-[0.99] " +
                  (role === "reader" ? "border-king-orange/30 bg-king-orange/10" : "")
                }
              >
                <div className="text-sm font-black">Reader</div>
                <p className="mt-2 text-sm text-foreground/60">Save favorites, comment, and follow creators.</p>
              </button>
              <button
                type="button"
                onClick={() => setRole("blogger")}
                disabled={busy}
                className={
                  "glass-card p-6 text-left active:scale-[0.99] " +
                  (role === "blogger" ? "border-king-orange/30 bg-king-orange/10" : "")
                }
              >
                <div className="text-sm font-black">Blogger</div>
                <p className="mt-2 text-sm text-foreground/60">Access the studio and publish posts.</p>
              </button>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-foreground/50">Name</label>
                <div className="mt-2">
                  <Input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Your name" />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-foreground/50">Email</label>
                <div className="mt-2">
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-foreground/50">Password</label>
                <div className="mt-2">
                  <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Minimum 8 characters" />
                </div>
                <div className="mt-3">
                  <PasswordFeedback password={password} />
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-foreground/50">State</label>
                <div className="mt-2">
                  <Select value={state} onChange={(e) => {
                    setState(e.target.value);
                    setLga("");
                  }}>
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
                <label className="text-xs font-mono text-foreground/50">LGA</label>
                <div className="mt-2">
                  <Select value={lga} onChange={(e) => setLga(e.target.value)} disabled={lgaDisabled}>
                    <option value="">{!state ? "Select a state first" : lgas.length === 0 ? "LGA list coming soon" : "Select an LGA"}</option>
                    {lgas.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-10 flex items-center justify-between gap-3">
            <GlassButton
              variant="ghost"
              onClick={() => setStep((s) => (s === 0 ? 0 : ((s - 1) as 0 | 1 | 2)))}
              disabled={step === 0 || busy}
            >
              Back
            </GlassButton>

            {step < 2 ? (
              <GlassButton
                variant="primary"
                onClick={() => setStep((s) => ((s + 1) as 0 | 1 | 2))}
                disabled={busy || (step === 1 && (!name.trim() || !email || password.length < 8))}
              >
                Continue
              </GlassButton>
            ) : (
              <GlassButton variant="primary" onClick={submit} disabled={!email || password.length < 8 || busy}>
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner /> Creating…
                  </span>
                ) : (
                  "Create Account"
                )}
              </GlassButton>
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
