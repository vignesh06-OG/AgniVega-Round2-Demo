/**
 * Offline transaction queue.
 *
 * Field connectivity in the Kopargaon–Nashik belt drops out constantly, so any
 * confirm-step mutation can be enqueued locally and replayed automatically when
 * the device comes back online. Persisted in localStorage so it survives
 * reloads and app restarts.
 */

const KEY = "agnivega:outbox:v1";

export interface QueuedTransaction {
  id: string;
  /** Logical operation name, e.g. "confirm-pool". */
  operation: string;
  /** Human label shown in the sync tray. */
  label: string;
  payload: unknown;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

type Handler = (payload: unknown) => Promise<unknown>;

const handlers = new Map<string, Handler>();
const listeners = new Set<() => void>();
let flushing = false;

function read(): QueuedTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as QueuedTransaction[];
  } catch {
    return [];
  }
}

function write(items: QueuedTransaction[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* quota or private mode */
  }
  for (const l of listeners) l();
}

export function subscribeQueue(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getQueue(): QueuedTransaction[] {
  return read();
}

export function registerHandler(operation: string, handler: Handler): void {
  handlers.set(operation, handler);
}

export function enqueue(operation: string, label: string, payload: unknown): QueuedTransaction {
  const item: QueuedTransaction = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    operation,
    label,
    payload,
    createdAt: Date.now(),
    attempts: 0,
  };
  write([...read(), item]);
  return item;
}

export function remove(id: string): void {
  write(read().filter((item) => item.id !== id));
}

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/**
 * Runs an operation immediately when online, otherwise queues it.
 * Returns `{ queued: true }` when deferred.
 */
export async function runOrQueue<T>(
  operation: string,
  label: string,
  payload: unknown,
): Promise<{ queued: boolean; result?: T }> {
  const handler = handlers.get(operation);
  if (!handler) throw new Error(`No offline handler registered for "${operation}"`);
  if (!isOnline()) {
    enqueue(operation, label, payload);
    return { queued: true };
  }
  try {
    const result = (await handler(payload)) as T;
    return { queued: false, result };
  } catch (error) {
    if (!isOnline()) {
      enqueue(operation, label, payload);
      return { queued: true };
    }
    throw error;
  }
}

/** Replays queued transactions in order. Safe to call repeatedly. */
export async function flushQueue(): Promise<{ sent: number; failed: number }> {
  if (flushing || !isOnline()) return { sent: 0, failed: 0 };
  flushing = true;
  let sent = 0;
  let failed = 0;
  try {
    for (const item of read()) {
      const handler = handlers.get(item.operation);
      if (!handler) continue;
      try {
        await handler(item.payload);
        remove(item.id);
        sent += 1;
      } catch (error) {
        failed += 1;
        write(
          read().map((q) =>
            q.id === item.id
              ? { ...q, attempts: q.attempts + 1, lastError: (error as Error).message }
              : q,
          ),
        );
        if (!isOnline()) break;
      }
    }
  } finally {
    flushing = false;
  }
  return { sent, failed };
}

let watching = false;

/** Flushes on reconnect and on an interval while online. */
export function watchConnectivity(onFlush?: (r: { sent: number; failed: number }) => void): void {
  if (watching || typeof window === "undefined") return;
  watching = true;
  const run = () => {
    void flushQueue().then((r) => {
      if (r.sent || r.failed) onFlush?.(r);
    });
  };
  window.addEventListener("online", run);
  window.setInterval(run, 30_000);
  run();
}
