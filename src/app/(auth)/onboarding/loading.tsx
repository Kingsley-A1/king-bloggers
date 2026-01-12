import { Sparkles } from "lucide-react";

export default function OnboardingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Sparkles className="h-12 w-12 text-king-orange" />
        <p className="text-foreground/60">Loading your experience...</p>
      </div>
    </div>
  );
}
