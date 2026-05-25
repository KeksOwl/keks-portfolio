// Client-side i18n instead of URL-based ([locale] segment) because for a static export
// on GitHub Pages with only English targeted for SEO, route-based i18n is overengineering.
// Also because I wanted it this way.
"use client";

import { createContext, useContext, useEffect, useCallback, useSyncExternalStore, type ReactNode } from "react";
import styles from "./locale-provider.module.scss";

export type Locale = "en" | "ru";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
});

export function useLocale() {
  return useContext(LocaleContext);
}

// --- External locale store ---
let currentLocale: Locale = "en";
let initialized = false;
const subscribers = new Set<() => void>();

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => { subscribers.delete(cb); };
}

function getSnapshot(): Locale {
  return currentLocale;
}

function getServerSnapshot(): Locale {
  return "en";
}

function initLocale() {
  if (initialized) return;
  initialized = true;
  const saved = localStorage.getItem("locale");
  if (saved === "en" || saved === "ru") {
    currentLocale = saved;
  } else if (navigator.language.startsWith("ru")) {
    currentLocale = "ru";
  }
  subscribers.forEach(cb => cb());
}

function updateLocale(newLocale: Locale) {
  currentLocale = newLocale;
  localStorage.setItem("locale", newLocale);
  subscribers.forEach(cb => cb());
}

// --- Hydration flag ---
const noop = () => () => {};
const getHydrated = () => true;
const getServerHydrated = () => false;

// --- Provider ---
interface LocaleProviderProps {
  children: ReactNode;
}

export default function LocaleProvider({ children }: LocaleProviderProps) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(noop, getHydrated, getServerHydrated);

  useEffect(() => { initLocale(); }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    updateLocale(newLocale);
  }, []);

  const visible = hydrated && initialized;

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <div className={`${styles.wrapper} ${visible ? styles.ready : ""}`}>
        {children}
      </div>
    </LocaleContext.Provider>
  );
}
