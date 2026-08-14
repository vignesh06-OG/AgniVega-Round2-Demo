import { FlaskConical, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { closeDemo, useDemoMode } from "@/lib/demo/demo-mode";

/** Sticky strip announcing seeded demo data, with a one-tap exit. */
export function DemoBanner() {
  const [demo] = useDemoMode();
  if (!demo) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-accent px-4 py-1.5 text-center text-xs font-medium text-accent-foreground">
      <span className="inline-flex items-center gap-1.5">
        <FlaskConical className="h-3.5 w-3.5" />
        Demo mode — seeded Kopargaon–Nashik loads, prices and pools
      </span>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 gap-1 px-2 text-xs hover:bg-accent-foreground/10"
        onClick={() => void closeDemo()}
      >
        <X className="h-3.5 w-3.5" /> Exit demo
      </Button>
    </div>
  );
}

/** Re-entry control for portals once demo mode has been switched off. */
export function DemoToggleButton() {
  const [demo, setDemo] = useDemoMode();
  if (demo) return null;
  return (
    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setDemo(true)}>
      <FlaskConical className="h-3.5 w-3.5" /> Demo mode
    </Button>
  );
}
