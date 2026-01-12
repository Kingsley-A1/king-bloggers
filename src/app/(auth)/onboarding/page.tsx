"use client";

import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";

// Dynamically import the client component with no SSR
const OnboardingClient = dynamic(
  () => import("./OnboardingClient").then((mod) => mod.OnboardingClient),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Sparkles className="h-12 w-12 text-king-orange" />
          <p className="text-foreground/60">Loading your experience...</p>
        </div>
      </div>
    ),
  }
);

export default function OnboardingPage() {
  return <OnboardingClient />;
}
