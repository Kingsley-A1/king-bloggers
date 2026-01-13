"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { GlassButton } from "@/components/ui/GlassButton";
import { upgradeToBlooger } from "@/lib/actions/role";

export function UpgradeButton() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);

    try {
      const result = await upgradeToBlooger();

      if (result.ok) {
        // Force a hard refresh to update the session
        window.location.reload();
      } else {
        setError(result.error ?? "Something went wrong");
      }
    } catch {
      setError("Failed to upgrade. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <GlassButton
        variant="primary"
        size="lg"
        onClick={handleUpgrade}
        loading={loading}
        loadingText="Upgrading..."
        className="w-full gap-2 shadow-lg shadow-king-orange/30"
      >
        <Sparkles className="h-5 w-5" />
        Upgrade to Blogger — Free
      </GlassButton>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
