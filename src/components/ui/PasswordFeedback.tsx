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

  // Color based on strength
  const barColor =
    s.points <= 1
      ? "bg-red-500"
      : s.points === 2
      ? "bg-orange-500"
      : s.points === 3
      ? "bg-yellow-500"
      : s.points === 4
      ? "bg-lime-500"
      : "bg-green-500";

  if (!password) return null;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            barColor
          )}
          style={{ width: `${s.pct}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="text-[10px] text-foreground/50 text-right">{s.label}</div>
    </div>
  );
}
