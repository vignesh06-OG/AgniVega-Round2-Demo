import { CloudOff, RefreshCw, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  flushQueue,
  getQueue,
  subscribeQueue,
  watchConnectivity,
  type QueuedTransaction,
} from "@/lib/offline/queue";

/** Shows connectivity state and any transactions waiting to sync. */
export function OfflineTray() {
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<QueuedTransaction[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const refresh = () => setQueue(getQueue());
    refresh();
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const unsubscribe = subscribeQueue(refresh);
    watchConnectivity((r) => {
      refresh();
      if (r.sent) toast.success(`${r.sent} queued action${r.sent > 1 ? "s" : ""} synced`);
    });
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      unsubscribe();
    };
  }, []);

  if (online && queue.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-[20rem] max-w-[92vw] rounded-lg border border-border bg-card/95 p-3 text-xs shadow-xl backdrop-blur">
      <div className="flex items-center gap-2 font-semibold">
        {online ? (
          <UploadCloud className="h-4 w-4" />
        ) : (
          <CloudOff className="h-4 w-4 text-destructive" />
        )}
        {online ? "Pending sync" : "Offline mode"}
      </div>
      <p className="mt-1 text-muted-foreground">
        {online
          ? `${queue.length} action${queue.length === 1 ? "" : "s"} waiting to reach the server.`
          : "Cached pages stay usable. Confirmations are queued and sent automatically when the network returns."}
      </p>
      {queue.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {queue.slice(0, 4).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2">
              <span className="truncate">{item.label}</span>
              <span className="text-muted-foreground">
                {item.attempts > 0 ? `retry ${item.attempts}` : "queued"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {online && queue.length > 0 ? (
        <Button
          size="sm"
          variant="outline"
          className="mt-2 h-7 w-full text-xs"
          disabled={syncing}
          onClick={() => {
            setSyncing(true);
            void flushQueue().then((r) => {
              setSyncing(false);
              setQueue(getQueue());
              if (r.sent) toast.success(`${r.sent} action(s) synced`);
              if (r.failed) toast.error(`${r.failed} action(s) still pending`);
            });
          }}
        >
          <RefreshCw className={`mr-1 h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} /> Sync now
        </Button>
      ) : null}
    </div>
  );
}
