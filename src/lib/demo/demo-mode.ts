import { useSyncExternalStore } from "react";

/**
 * App-wide demo mode. When on, portals show seeded Kopargaon–Nashik data so a
 * jury demo never depends on live traffic. Persisted per browser.
 */
const KEY = "agnivega:demo";
const listeners = new Set<() => void>();
let cached: boolean | null = null;

function read(): boolean {
  if (typeof window === "undefined") return false;
  if (cached !== null) return cached;
  try {
    cached = localStorage.getItem(KEY) !== "0";
  } catch {
    cached = true;
  }
  return cached;
}

export function isDemoMode(): boolean {
  return read();
}

export function setDemoMode(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    /* storage blocked */
  }
  cached = on;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useDemoMode(): [boolean, (on: boolean) => void] {
  const value = useSyncExternalStore(subscribe, read, () => false);
  return [value, setDemoMode];
}

export const DEMO_ACCOUNTS = [
  {
    role: "admin",
    email: "admin@agnivega.demo",
    password: "Agnivega@2026",
    label: "Admin control tower",
  },
  {
    role: "farmer",
    email: "farmer@agnivega.demo",
    password: "Agnivega@2026",
    label: "Farmer portal",
  },
  {
    role: "driver",
    email: "driver@agnivega.demo",
    password: "Agnivega@2026",
    label: "Driver cockpit",
  },
  {
    role: "fleet",
    email: "fleet@agnivega.demo",
    password: "Agnivega@2026",
    label: "Fleet console",
  },
] as const;

/**
 * Full "close demo" flow: stops any running shift simulation, wipes every
 * browser-side demo artefact (jobs, transcripts, queued demo transactions)
 * and returns the app to a clean non-demo state.
 */
export async function closeDemo(): Promise<void> {
  const { stopSimulation } = await import("./simulation");
  const { clearTranscripts } = await import("@/lib/voice/transcripts");
  stopSimulation();
  clearTranscripts();
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("agnivega:demo:")) localStorage.removeItem(key);
    }
  } catch {
    /* storage blocked */
  }
  setDemoMode(false);
}
