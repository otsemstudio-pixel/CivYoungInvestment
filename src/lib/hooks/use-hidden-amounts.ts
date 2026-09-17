"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "patrimoine:hide-amounts";
const CHANGE_EVENT = "patrimoine:hide-amounts-changed";

function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getServerSnapshot() {
  return false;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function useHiddenAmounts() {
  const hidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    try {
      window.localStorage.setItem(STORAGE_KEY, hidden ? "0" : "1");
    } catch {
      // localStorage indisponible (navigation privée…) : la préférence ne
      // survivra pas au rechargement, mais le bouton reste utilisable.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return { hidden, toggle };
}
