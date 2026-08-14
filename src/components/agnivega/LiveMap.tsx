import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { MapPoint } from "./LiveMapCanvas";

const Canvas = lazy(() => import("./LiveMapCanvas"));

export type { MapPoint };

/**
 * Client-only wrapper around the Leaflet canvas. Leaflet touches `window` at
 * import time, so the module is only pulled in after hydration.
 */
export function LiveMap({
  points,
  route,
  height = 300,
}: {
  points: MapPoint[];
  route?: { lat: number; lng: number }[] | undefined;
  height?: number | undefined;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Only pull Leaflet and its tiles once the map scrolls into view.
  useEffect(() => {
    const node = holder.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!visible) {
    return (
      <div
        ref={holder}
        className="animate-pulse rounded-lg border bg-secondary/50"
        style={{ height }}
        aria-hidden
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div className="animate-pulse rounded-lg border bg-secondary/50" style={{ height }} />
      }
    >
      <div ref={holder} className="overflow-hidden rounded-lg border">
        <Canvas points={points} route={route} height={height} />
      </div>
    </Suspense>
  );
}
