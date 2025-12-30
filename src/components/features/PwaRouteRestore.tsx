"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { readAndClearInstallReturnTo, readLastUrl, rememberLastUrl } from "./InstallAppPrompt";

function isStandalone() {
  const nav = navigator as unknown as { standalone?: boolean };
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    Boolean(nav.standalone)
  );
}

export function PwaRouteRestore() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  React.useEffect(() => {
    // Always keep last visited url fresh.
    rememberLastUrl();
  }, [pathname, search]);

  React.useEffect(() => {
    if (!isStandalone()) return;

    const returnTo = readAndClearInstallReturnTo();
    const last = readLastUrl();

    // When launched from home screen, start_url is usually /. Restore the last/return route.
    const current = window.location.pathname + window.location.search;
    const shouldRestore = current === "/" || current.startsWith("/?source=pwa");

    const target = returnTo ?? last;
    if (shouldRestore && target && target !== current) {
      router.replace(target);
    }
  }, [router]);

  return null;
}
