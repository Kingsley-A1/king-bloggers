"use client";

import * as React from "react";
import Image from "next/image";
import { X, Share, PlusSquare } from "lucide-react";

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

function isMobileDevice() {
  if (typeof window === "undefined") return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

const LAST_URL_KEY = "kb_last_url";
const RETURN_TO_KEY = "kb_install_return_to";
const DISMISSED_KEY = "kb_install_dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const MOBILE_SHOW_DELAY = 3000; // Show after 3 seconds on mobile

export function InstallAppPrompt({ className }: { className?: string }) {
  const [deferred, setDeferred] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);

  React.useEffect(() => {
    const iosCheck = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const mobileCheck = isMobileDevice();
    setIsIOS(iosCheck);

    // Check if should show based on dismissal
    const dismissedAt = safeLocalStorageGet(DISMISSED_KEY);
    const shouldShow =
      !dismissedAt || Date.now() - Number(dismissedAt) > DISMISS_DURATION;

    // Handler for Chrome/Android install prompt
    function onBIP(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);

      if (shouldShow && !isStandalone()) {
        setOpen(true);
      }
    }

    window.addEventListener("beforeinstallprompt", onBIP);

    // 👑 SMART MOBILE DETECTION
    // On mobile web (no beforeinstallprompt), show after short delay
    let mobileTimer: ReturnType<typeof setTimeout> | null = null;

    if (mobileCheck && shouldShow && !isStandalone()) {
      mobileTimer = setTimeout(() => {
        // Double-check we haven't received beforeinstallprompt
        // If deferred is still null, show iOS-style prompt
        setOpen((current) => {
          // Only auto-show if not already open
          return current || true;
        });
      }, MOBILE_SHOW_DELAY);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      if (mobileTimer) clearTimeout(mobileTimer);
    };
  }, []);

  async function install() {
    const returnTo =
      window.location.pathname + window.location.search + window.location.hash;
    safeLocalStorageSet(RETURN_TO_KEY, returnTo);

    if (!deferred) {
      // iOS/Safari path: just close; user installs via Share menu.
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

  // iOS-specific instructions
  const showIOSInstructions = isIOS && !deferred;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 p-4 animate-[kingFadeIn_0.4s_ease-out]",
        className
      )}
    >
      <div className="mx-auto max-w-lg">
        <GlassCard className="relative p-5 border-king-orange/30 shadow-xl shadow-king-orange/10 bg-background/95 backdrop-blur-xl">
          {/* Close Button */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-foreground/10 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-foreground/50" />
          </button>

          <div className="flex items-start gap-4">
            {/* App Icon */}
            <div className="relative shrink-0 w-14 h-14 rounded-2xl overflow-hidden border border-foreground/10 bg-foreground/5 shadow-lg">
              <Image
                src="/icons/logo.png"
                alt="King Bloggers"
                fill
                sizes="56px"
                className="object-contain"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black tracking-tight">
                Install King Bloggers
              </h3>
              <p className="mt-1 text-sm text-foreground/60 leading-relaxed">
                {showIOSInstructions
                  ? "Add to your home screen for the best experience."
                  : "Get fast access with offline support and push notifications."}
              </p>

              {/* iOS Instructions */}
              {showIOSInstructions && (
                <div className="mt-3 flex items-center gap-2 text-xs text-foreground/70 bg-foreground/5 rounded-lg px-3 py-2">
                  <span>Tap</span>
                  <Share className="h-4 w-4 text-king-orange" />
                  <span>then</span>
                  <PlusSquare className="h-4 w-4 text-king-orange" />
                  <span className="font-medium">
                    &quot;Add to Home Screen&quot;
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex items-center gap-3">
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={dismiss}
                  className="text-foreground/60"
                >
                  Maybe Later
                </GlassButton>
                {!showIOSInstructions && (
                  <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={install}
                    disabled={!deferred}
                    className="shadow-lg shadow-king-orange/30"
                  >
                    Install App
                  </GlassButton>
                )}
              </div>
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
