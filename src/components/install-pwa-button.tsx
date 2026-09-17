"use client";

import { useSyncExternalStore } from "react";
import {
  getPwaInstallServerSnapshot,
  getPwaInstallSnapshot,
  promptPwaInstall,
  subscribePwaInstall,
} from "@/lib/pwa-install";

export function InstallPwaButton() {
  const available = useSyncExternalStore(
    subscribePwaInstall,
    getPwaInstallSnapshot,
    getPwaInstallServerSnapshot,
  );

  if (!available) return null;

  return (
    <button
      type="button"
      onClick={() => promptPwaInstall()}
      className="rounded-lg border border-border px-4 py-3 text-base font-medium text-foreground"
    >
      Réinstaller l&apos;application
    </button>
  );
}
