"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type PasswordFeedbackProps = {
  password: string;
  minLength?: number;
  className?: string;
};

function scorePassword(password: string, minLength: number) {
  const lengthOk = password.length >= minLength;
  const lowerOk = /[a-z]/.test(password);
  const upperOk = /[A-Z]/.test(password);
  const numberOk = /\d/.test(password);
  const symbolOk = /[^A-Za-z0-9]/.test(password);

  const points = [lengthOk, lowerOk, upperOk, numberOk, symbolOk].filter(
    Boolean
  ).length;

  const label =
    points <= 1
      ? "Very weak"
      : points === 2
      ? "Weak"
      : points === 3
      ? "Okay"
      : points === 4
      ? "Strong"
      : "Very strong";
  const pct = Math.min(100, Math.round((points / 5) * 100));

  return {
    points,
    pct,
    label,
    checks: {
      lengthOk,
      lowerOk,
      upperOk,
      numberOk,
      symbolOk,
    },
  };
}

export function PasswordFeedback({
  password,
  minLength = 8,
  className,
}: PasswordFeedbackProps) {
  const s = React.useMemo(
    () => scorePassword(password, minLength),
    [password, minLength]
  );

  return (
    <div
      className={cn(
        "rounded-2xl border border-foreground/10 bg-foreground/5 p-4",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-mono text-foreground/60">
          Password strength
        </div>
        <div className="text-xs font-mono text-foreground/60">
          {password.length}/{minLength} • {s.label}
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full bg-king-orange/70 transition-[width] duration-300"
          style={{ width: `${s.pct}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="mt-4 grid gap-1 text-xs text-foreground/70">
        <div
          className={cn(
            s.checks.lengthOk ? "text-foreground/70" : "text-foreground/50"
          )}
        >
          • At least {minLength} characters
        </div>
        <div
          className={cn(
            s.checks.lowerOk ? "text-foreground/70" : "text-foreground/50"
          )}
        >
          • One lowercase letter
        </div>
        <div
          className={cn(
            s.checks.upperOk ? "text-foreground/70" : "text-foreground/50"
          )}
        >
          • One uppercase letter
        </div>
        <div
          className={cn(
            s.checks.numberOk ? "text-foreground/70" : "text-foreground/50"
          )}
        >
          • One number
        </div>
        <div
          className={cn(
            s.checks.symbolOk ? "text-foreground/70" : "text-foreground/50"
          )}
        >
          • One symbol
        </div>
      </div>
    </div>
  );
}
