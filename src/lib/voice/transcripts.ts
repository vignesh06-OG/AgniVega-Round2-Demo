import { useSyncExternalStore } from "react";

/** A saved voice turn, replayable as a caption after the session. */
export interface Transcript {
  id: string;
  text: string;
  reply: string | null;
  lang: string;
  seconds: number;
  at: number;
}

const KEY = "agnivega:transcripts";
const MAX = 40;

let cache: Transcript[] | null = null;
const listeners = new Set<() => void>();
const EMPTY: Transcript[] = [];

function read(): Transcript[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Transcript[]) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: Transcript[]): void {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage blocked */
  }
  for (const listener of listeners) listener();
}

export function saveTranscript(entry: Omit<Transcript, "id" | "at">): Transcript {
  const record: Transcript = {
    ...entry,
    id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
  };
  write([record, ...read()].slice(0, MAX));
  return record;
}

export function clearTranscripts(): void {
  cache = EMPTY;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage blocked */
  }
  for (const listener of listeners) listener();
}

export function getTranscripts(): Transcript[] {
  return read();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTranscripts(): Transcript[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
