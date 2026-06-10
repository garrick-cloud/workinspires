"use client";

import { useEffect } from "react";

const THEME_STORAGE_KEY = "workinspires-shadcn-dark-mode";
const THEME_EVENT = "workinspires-theme-change";

function applyShadcnDarkMode(enabled: boolean) {
  document.documentElement.classList.toggle("shadcn-dark-mode", enabled);
}

export function setShadcnDarkModePreference(enabled: boolean) {
  window.localStorage.setItem(THEME_STORAGE_KEY, String(enabled));
  applyShadcnDarkMode(enabled);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: enabled }));
}

export function getShadcnDarkModePreference() {
  return window.localStorage.getItem(THEME_STORAGE_KEY) === "true";
}

export default function ThemeSync() {
  useEffect(() => {
    applyShadcnDarkMode(getShadcnDarkModePreference());

    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      applyShadcnDarkMode(Boolean(customEvent.detail));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        applyShadcnDarkMode(event.newValue === "true");
      }
    };

    window.addEventListener(THEME_EVENT, handleThemeChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(THEME_EVENT, handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return null;
}
