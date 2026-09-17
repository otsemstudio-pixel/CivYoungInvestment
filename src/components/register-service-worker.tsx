"use client";

import { useEffect } from "react";
import "@/lib/pwa-install";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // installation impossible (navigateur non compatible, etc.) : silencieux.
      });
    }
  }, []);

  return null;
}
