"use client";

import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  safeLocalStorageGet,
  safeLocalStorageRemove,
  safeLocalStorageSet,
} from "@/lib/safe-storage";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  // iOS Safari uses navigator.standalone
  const nav = navigator as unknown as { standalone?: boolean };
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    Boolean(nav.standalone)
  );
}

const LAST_URL_KEY = "kb_last_url";
const RETURN_TO_KEY = "kb_install_return_to";
const DISMISSED_KEY = "kb_install_dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallAppPrompt({ className }: { className?: string }) {
  const [deferred, setDeferred] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);

  React.useEffect(() => {
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));

    function onBIP(e: Event) {
      // Chrome/Edge/Android
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);

      // Check if previously dismissed and if 7 days have passed
      const dismissedAt = safeLocalStorageGet(DISMISSED_KEY);
      const shouldShow =
        !dismissedAt || Date.now() - Number(dismissedAt) > DISMISS_DURATION;

      if (shouldShow && !isStandalone()) setOpen(true);
    }

    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  React.useEffect(() => {
    // iOS has no beforeinstallprompt, but we still want a clean install hint.
    const dismissedAt = safeLocalStorageGet(DISMISSED_KEY);
    const shouldShow =
      !dismissedAt || Date.now() - Number(dismissedAt) > DISMISS_DURATION;
    if (shouldShow && isIOS && !isStandalone()) setOpen(true);
  }, [isIOS]);

  async function install() {
    const returnTo =
      window.location.pathname + window.location.search + window.location.hash;
    safeLocalStorageSet(RETURN_TO_KEY, returnTo);

    if (!deferred) {
      // iOS path: just close; user installs via Share menu.
      setOpen(false);
      return;
    }

    await deferred.prompt();
    const choice = await deferred.userChoice;

    if (choice.outcome === "accepted") {
      setOpen(false);
    } else {
      safeLocalStorageSet(DISMISSED_KEY, String(Date.now()));
      setOpen(false);
    }
  }

  function dismiss() {
    safeLocalStorageSet(DISMISSED_KEY, String(Date.now()));
    setOpen(false);
  }

  if (!open) return null;
  if (isStandalone()) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-4 z-50 px-4 animate-[kingFadeIn_0.5s_ease-out]",
        className
      )}
    >
      <div className="mx-auto max-w-2xl">
        <GlassCard className="p-4 md:p-5 border-king-orange/20 shadow-lg shadow-king-orange/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0 w-10 h-10 rounded-xl overflow-hidden border border-foreground/10 bg-foreground/5">
                <Image
                  src="/icons/logo.png"
                  alt="King Bloggers"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <div>
                <div className="text-sm font-black tracking-tight flex items-center gap-2">
                  Install King Bloggers
                  <span className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider bg-king-orange/20 text-king-orange rounded-full">
                    PWA
                  </span>
                </div>
                <div className="mt-0.5 text-sm text-foreground/60">
                  {deferred
                    ? "Get the premium, distraction-free app experience."
                    : isIOS
                    ? "Tap Share → Add to Home Screen."
                    : "Install is not available on this browser."}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <GlassButton variant="ghost" onClick={dismiss} className="px-4">
                Not now
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={install}
                disabled={!deferred && !isIOS}
              >
                Install App
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export function rememberLastUrl() {
  const href =
    window.location.pathname + window.location.search + window.location.hash;
  safeLocalStorageSet(LAST_URL_KEY, href);
}

export function readAndClearInstallReturnTo(): string | null {
  const v = safeLocalStorageGet(RETURN_TO_KEY);
  if (v) safeLocalStorageRemove(RETURN_TO_KEY);
  return v;
}

export function readLastUrl(): string | null {
  return safeLocalStorageGet(LAST_URL_KEY);
}
