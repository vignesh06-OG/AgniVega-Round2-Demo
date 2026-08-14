import { Trash2, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { clearTranscripts, useTranscripts } from "@/lib/voice/transcripts";
import { speak } from "./VoiceInput";
import type { Lang } from "@/lib/krishi/i18n";

/** Saved captions from this voice session, replayable in the same language. */
export function TranscriptLog({ lang }: { lang: Lang }) {
  const transcripts = useTranscripts();
  if (transcripts.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border bg-card p-3" data-testid="transcript-log">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Session captions
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1 px-2 text-xs"
          onClick={clearTranscripts}
        >
          <Trash2 className="h-3.5 w-3.5" /> Clear
        </Button>
      </div>
      <ul className="space-y-2">
        {transcripts.slice(0, 8).map((item) => (
          <li key={item.id} className="rounded-md bg-secondary/40 p-2 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="flex-1">{item.text}</p>
              <button
                type="button"
                aria-label="Replay caption"
                className="rounded p-1 text-muted-foreground hover:bg-accent/20"
                onClick={() => speak(item.text, lang)}
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
            {item.reply && <p className="mt-1 text-xs text-muted-foreground">↳ {item.reply}</p>}
            <p className="mt-1 text-[11px] text-muted-foreground">
              {new Date(item.at).toLocaleTimeString("en-IN")} · {item.lang} ·{" "}
              {item.seconds.toFixed(1)}s
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
